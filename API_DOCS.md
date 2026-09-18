# La Suite Task – API reference

Backend for a to-do app: tasks with provenance (App, Tchap, Docs, Mail, Visio), AI task extraction from free text (Mistral), live updates (Server-Sent Events + WebSocket), and live speech-to-text (Voxtral) over WebSocket.

Stack: [Bun](https://bun.sh) + [Elysia](https://elysiajs.com) + Prisma (PostgreSQL).

## Connecting

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| Base URL       | `https://nudge.ovh/api/lasuite-jalon`                           |
| WebSocket base | `wss://nudge.ovh/api/lasuite-jalon`                             |
| Auth           | None. Every endpoint is public.                                 |
| CORS           | Only allowed browser origins can call the HTTP API (see below). |
| Content type   | `application/json` for request and response bodies              |

All paths below are relative to the base URL, e.g. `GET /tasks` → `https://nudge.ovh/api/lasuite-jalon/tasks`.

Use `https://` / `wss://`: plain `http://` gets a 301 redirect, which breaks `POST`/`PATCH` bodies and WebSockets.

```ts
const API_BASE = "https://nudge.ovh/api/lasuite-jalon";
const WS_BASE = API_BASE.replace(/^http/, "ws"); // wss://nudge.ovh/api/lasuite-jalon
```

### Calling from a browser app

The server only sends CORS headers to origins listed in its `CORS_ORIGINS` env var (comma-separated). `http://localhost:3000` is allowed on the deployed server; any other origin must be added there by whoever runs the deployment, otherwise the browser blocks the request.

CORS settings: methods `GET, POST, PATCH, DELETE, OPTIONS`, header `Content-Type` only, no credentials (don't send cookies or `credentials: "include"`).

Server-to-server calls (curl, Node, a backend) aren't affected by CORS.

WebSockets aren't covered by CORS: the backend doesn't check the origin, so any page can open them.

Alternative for a local frontend: proxy requests through your dev server and call relative URLs. With Vite:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://nudge.ovh",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, "/api/lasuite-jalon"),
      },
    },
  },
});
```

Then `fetch('/api/tasks')` reaches `https://nudge.ovh/api/lasuite-jalon/tasks`.

## Data model

### `Task`

```ts
type TaskOrigin = "APP" | "TCHAP" | "DOCS" | "MAIL" | "VISIO";
type TaskDetectionStatus = "DETECTED" | "CONFIRMED" | "IGNORED";

type Task = {
  id: string; // UUID
  title: string; // non-empty
  content: string | null;
  reminder: string | null; // ISO 8601 datetime (UTC, e.g. "2026-03-03T08:00:00.000Z")
  done: boolean; // default false
  validated: boolean; // default false – set true once the user has reviewed an AI-generated task
  userId: string | null; // not settable through the API
  origin: TaskOrigin; // where the task comes from, default "APP"

  // AI detection (Mail / Visio flows). null for manual and explicit-integration
  // tasks, which are confirmed by construction.
  detectionStatus: TaskDetectionStatus | null;

  // Provenance: describes the source item the task was created from
  sourceLabel: string | null; // human-readable source, e.g. a mail subject or doc title
  sourceExternalId: string | null; // id of the item in the source system
  sourceUrl: string | null; // link back to the source item
  sourceExcerpt: string | null; // the passage the task was taken from

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
```

Dates are returned as ISO 8601 strings in UTC. When sending a `reminder`, any string parseable as a date works; an ISO 8601 string with offset is recommended (`"2026-03-03T09:00:00+01:00"`).

**Which fields can the API set?**

| Field                                                           | `POST /tasks/from-text` | `PATCH /tasks/:id` |
| --------------------------------------------------------------- | ----------------------- | ------------------ |
| `title`, `content`, `reminder`                                  | filled by the AI        | ✅                 |
| `done`, `validated`                                             | defaults (`false`)      | ✅                 |
| `detectionStatus`                                               | `null`                  | ✅                 |
| `origin`                                                        | `"APP"`                 | ❌                 |
| `sourceLabel`, `sourceExternalId`, `sourceUrl`, `sourceExcerpt` | `null`                  | ❌                 |
| `userId`                                                        | `null`                  | ❌                 |

> ⚠️ There is currently **no `POST /tasks`** endpoint: the only way to create a task is `POST /tasks/from-text`. As a result `origin`, the `source*` fields and `userId` can't be set through the API yet. The schema, validators and a `created` event exist in the code, so a create endpoint is expected to come back.

## Errors

| Status | When                                                                    | Body                                                                                       |
| ------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `404`  | `PATCH` / `DELETE` on an unknown task id                                | `{ "error": "Not found" }`                                                                 |
| `404`  | Unknown path                                                            | `NOT_FOUND` (plain text)                                                                   |
| `422`  | Body fails validation (missing field, empty `title`, wrong enum value…) | Elysia validation error object (`type`, `on`, `property`, `message`, `summary`, `errors`…) |
| `500`  | Unexpected error (e.g. database down)                                   | Text/JSON error                                                                            |

Example `422`:

```json
{
  "type": "validation",
  "on": "body",
  "property": "/text",
  "message": "Expected string",
  "summary": "Expected property 'text' to be string but found: undefined"
}
```

## HTTP endpoints

### `GET /health`

Liveness check.

```bash
curl https://nudge.ovh/api/lasuite-jalon/health
```

```json
{ "status": "ok" }
```

---

### `GET /tasks`

List all tasks, newest first (`createdAt desc`). No pagination or filtering: filter on `origin`, `detectionStatus`, `done`… client-side.

**Response 200:** `Task[]`

---

### `POST /tasks/from-text`

Create a task from a free-text (or dictated) note. The AI rewrites it into `title` / `content` / `reminder`.

This is **asynchronous**:

1. The endpoint immediately saves and returns a provisional task: `title` = first 80 chars of `text`, `content` = full `text`, `reminder` = null, `origin` = `"APP"`, `validated` = false.
2. In the background, Mistral extracts the real fields and the task is updated.
3. The updated task is pushed on **`WS /tasks/live`** as a `task.updated` event. If extraction fails, the provisional task stays as-is (error only logged server-side).

Note: neither the provisional task nor the AI update is sent on `GET /tasks/events` (SSE). Listen on `WS /tasks/live` for the AI result, or refetch `GET /tasks`.

**Body**

| Field      | Type                  | Required | Notes                                                                     |
| ---------- | --------------------- | -------- | ------------------------------------------------------------------------- |
| `text`     | string, min length 1  | yes      | The note, any language. Output keeps the note's language.                 |
| `timeZone` | IANA time zone string | no       | Used to resolve "tomorrow at 9", "next Friday"… Default `"Europe/Paris"`. |

```bash
curl -X POST https://nudge.ovh/api/lasuite-jalon/tasks/from-text \
  -H 'Content-Type: application/json' \
  -d '{"text":"Rappelle-moi demain matin à 9h d'\''ouvrir mes mails.","timeZone":"Europe/Paris"}'
```

**Response 200:** the provisional `Task`.

AI extraction rules (for context):

- `title`: short action starting with a verb (2–6 words, max 80 chars), no dates or "remind me" phrasing.
- `content`: cleaned note with date/time expressions removed, or `null` if empty.
- `reminder`: set only if the note mentions a date/time/deadline; a day without time → 09:00 local; otherwise `null`.

Tip: in a browser, pass `Intl.DateTimeFormat().resolvedOptions().timeZone` as `timeZone`.

---

### `PATCH /tasks/:id`

Partially update a task. Send only the fields to change.

**Body** (all optional)

| Field             | Type                                                 |
| ----------------- | ---------------------------------------------------- |
| `title`           | string, min length 1                                 |
| `content`         | string \| null                                       |
| `reminder`        | date string \| null                                  |
| `done`            | boolean                                              |
| `validated`       | boolean                                              |
| `detectionStatus` | `"DETECTED"` \| `"CONFIRMED"` \| `"IGNORED"` \| null |

```bash
# Mark as done
curl -X PATCH https://nudge.ovh/api/lasuite-jalon/tasks/<id> \
  -H 'Content-Type: application/json' \
  -d '{"done":true}'

# Confirm an AI-detected task
curl -X PATCH https://nudge.ovh/api/lasuite-jalon/tasks/<id> \
  -H 'Content-Type: application/json' \
  -d '{"detectionStatus":"CONFIRMED"}'
```

**Response 200:** the updated `Task`. **404** if the id doesn't exist.

Emits an `updated` event on `GET /tasks/events`.

---

### `DELETE /tasks/:id`

Delete a task (hard delete).

```bash
curl -X DELETE https://nudge.ovh/api/lasuite-jalon/tasks/<id>
```

**Response 200:** the deleted `Task`. **404** if the id doesn't exist.

Emits a `deleted` event on `GET /tasks/events`.

## Live updates

There are two live channels, and they carry **different** events:

| Channel             | Transport          | Events                                                       | Triggered by                                          |
| ------------------- | ------------------ | ------------------------------------------------------------ | ----------------------------------------------------- |
| `GET /tasks/events` | Server-Sent Events | `updated`, `deleted` (`created` defined but not emitted yet) | `PATCH`, `DELETE`                                     |
| `WS /tasks/live`    | WebSocket          | `task.updated`                                               | AI extraction finishing after `POST /tasks/from-text` |

To stay fully in sync today, a client should listen to both (or refetch `GET /tasks` when needed).

### `GET /tasks/events` (SSE)

`https://nudge.ovh/api/lasuite-jalon/tasks/events`

Server → client stream, `Content-Type: text/event-stream`. Each message is a `data:` line with JSON; there are no named SSE events (use `onmessage`, not `addEventListener("updated")`).

```ts
type TaskEvent =
  | { type: "created"; task: Task } // reserved, not emitted yet
  | { type: "updated"; task: Task }
  | { type: "deleted"; id: string };
```

Raw stream:

```
: connected

data: {"type":"updated","task":{...}}

: ping
```

- `: connected` is sent on open; `: ping` comment every 30 s keeps proxies from closing the connection. Comments are ignored by `EventSource`.
- Events are only for mutations made while you're connected (no replay, no `id:`). Fetch `GET /tasks` on (re)connect.
- Events are in-memory in a single backend process: fine for the current single deployment.

```ts
const es = new EventSource("https://nudge.ovh/api/lasuite-jalon/tasks/events");
es.onmessage = (e) => {
  const event = JSON.parse(e.data);
  if (event.type === "created" || event.type === "updated")
    upsertTask(event.task);
  if (event.type === "deleted") removeTask(event.id);
};
```

`EventSource` follows CORS rules: your origin must be in `CORS_ORIGINS`.

### `WS /tasks/live`

`wss://nudge.ovh/api/lasuite-jalon/tasks/live`

Server → client push channel. The client sends nothing; just keep it open (reconnect on close, since proxies may drop idle connections).

Messages (JSON text frames):

```ts
type LiveEvent = { type: "task.updated"; task: Task };
```

Only emitted when a `POST /tasks/from-text` extraction finishes.

```ts
const ws = new WebSocket("wss://nudge.ovh/api/lasuite-jalon/tasks/live");
ws.onmessage = (e) => {
  const event = JSON.parse(e.data);
  if (event.type === "task.updated") upsertTask(event.task);
};
```

## Speech-to-text

### `WS /transcribe`

`wss://nudge.ovh/api/lasuite-jalon/transcribe`

Real-time speech-to-text (Mistral Voxtral). One socket = one recording session.

**Client → server**

1. Binary frames: raw audio, **PCM signed 16-bit little-endian, 16 000 Hz, mono**. Send chunks as they're captured. You can start sending immediately after `open`; audio is buffered until the upstream session is ready.
2. When recording stops, one text frame: `{"type":"end"}`.

**Server → client** (JSON text frames)

```ts
type TranscribeEvent =
  | { type: "delta"; text: string } // incremental text, append to what you have
  | { type: "done"; text: string } // full final transcript
  | { type: "error"; message: string };
```

The server closes the socket after `done` or `error`. Closing the socket from the client aborts the session.

Typical flow to create a task by voice:

```
open WS /transcribe
  → send PCM chunks while recording (show "delta" text live)
  → send {"type":"end"}
  ← "done" { text }
POST /tasks/from-text { text, timeZone }
  ← provisional Task
WS /tasks/live
  ← "task.updated" { task }   (AI-filled title/content/reminder)
```

Browser capture sketch (resample to 16 kHz and convert Float32 → Int16). Microphone access requires the page itself to be served over HTTPS or from `localhost`.

```ts
const ws = new WebSocket("wss://nudge.ovh/api/lasuite-jalon/transcribe");
ws.binaryType = "arraybuffer";

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const ctx = new AudioContext({ sampleRate: 16000 });
// In an AudioWorklet (or ScriptProcessor), for each Float32Array `samples`:
const pcm = new Int16Array(samples.length);
for (let i = 0; i < samples.length; i++) {
  const s = Math.max(-1, Math.min(1, samples[i]));
  pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
}
ws.send(pcm.buffer);

// On stop:
ws.send(JSON.stringify({ type: "end" }));
```

## Endpoint summary

Base: `https://nudge.ovh/api/lasuite-jalon` (WebSockets: `wss://nudge.ovh/api/lasuite-jalon`)

| Method | Path               | Purpose                                     |
| ------ | ------------------ | ------------------------------------------- |
| GET    | `/health`          | Health check                                |
| GET    | `/tasks`           | List tasks (newest first)                   |
| GET    | `/tasks/events`    | SSE stream of `updated` / `deleted` events  |
| POST   | `/tasks/from-text` | Create task from free text (AI, async)      |
| PATCH  | `/tasks/:id`       | Update task fields, incl. `detectionStatus` |
| DELETE | `/tasks/:id`       | Delete task                                 |
| WS     | `/tasks/live`      | Receive `task.updated` after AI extraction  |
| WS     | `/transcribe`      | Live speech-to-text                         |

## Running it locally

```bash
docker compose up
```

Locally the base URL is `http://localhost:3001/api` (WebSockets `ws://localhost:3001/api`); every path above stays the same.

Env (`backend/.env`, see `.env.example`):

- `DATABASE_URL` – PostgreSQL connection string
- `PORT` – default `3001`
- `MISTRAL_API_KEY` – needed by `POST /tasks/from-text` and `WS /transcribe`
- `CORS_ORIGINS` – browser origins allowed to call the HTTP API (default `http://localhost:3000`)

Migrations live in `backend/prisma/migrations` (`bun run db:deploy` to apply).
