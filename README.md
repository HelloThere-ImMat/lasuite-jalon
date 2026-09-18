# Jalon: tasks for La Suite numérique

Jalon is a to-do app built for [La Suite numérique](https://lasuite.numerique.gouv.fr). Tasks can be created by hand, dictated, or written in free text that an AI turns into a structured task. Tasks can also come from other La Suite tools (Tchap, Docs, Mail, Visio). Tasks detected automatically from a mail or a meeting land in a "to review" list, where you confirm or ignore them.

- **Views:** Inbox, Today, Upcoming, Completed, Detected
- **AI:** task extraction and live speech-to-text, both using [Mistral](https://mistral.ai) (Voxtral)
- **Live updates:** Server-Sent Events + WebSocket
- **Runs as:** a web app, an installable PWA, and an iOS app (Capacitor, with Siri Shortcuts)
- **Demo:** `/demo` shows mock Tchap / Mail / Visio integrations sending tasks into the app

## Stack

| Part       | Tech                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `backend`  | [Bun](https://bun.sh), [Elysia](https://elysiajs.com), Prisma, PostgreSQL, Mistral SDK                                               |
| `frontend` | React 19, Vite, TanStack Query, React Router, [Cunningham](https://github.com/suitenumerique/cunningham) / La Suite UI kit, Capacitor |

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose
- [Bun](https://bun.sh) ≥ 1.3
- A Mistral API key. The free "Experiment" plan at [console.mistral.ai](https://console.mistral.ai) is enough. Without a key, everything works except AI extraction and dictation.

### 1. Backend + database

```bash
cp backend/.env.example backend/.env   # then set MISTRAL_API_KEY
docker compose up
```

This starts PostgreSQL, applies the Prisma migrations, and runs the API with hot reload at `http://localhost:3001/api`. Check it with `curl localhost:3001/api/health`.

### 2. Frontend

```bash
cd frontend
bun install
API_PROXY_TARGET=http://localhost:3001/api VITE_WS_BASE=http://localhost:3001/api bun run dev
```

Open http://localhost:5173.

If you skip the two environment variables, the frontend talks to the public demo backend (`https://nudge.ovh/api/lasuite-jalon`). That is handy for UI-only work.

### Running the backend without Docker

With a PostgreSQL instance already running and `DATABASE_URL` set in `backend/.env`:

```bash
cd backend
bun install
bun run db:generate && bun run db:deploy
bun run dev
```

## Configuration

Backend (`backend/.env`, see [`.env.example`](backend/.env.example)):

| Variable          | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string (Docker Compose sets this for you)      |
| `PORT`            | API port, default `3001`                                             |
| `MISTRAL_API_KEY` | Needed for AI task extraction and speech-to-text                     |
| `CORS_ORIGINS`    | Comma-separated browser origins allowed to call the HTTP API         |

The root `.env` can override the Compose defaults: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DB_PORT`, `BACKEND_PORT`.

Frontend (build or dev time):

| Variable           | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `API_PROXY_TARGET` | Where the Vite dev server proxies `/api` calls               |
| `VITE_API_BASE`    | HTTP API base URL used by production builds                  |
| `VITE_WS_BASE`     | WebSocket base URL (WebSockets skip the proxy)               |

## Useful commands

```bash
# backend/
bun run typecheck      # TypeScript check
bun run db:migrate     # create a new migration after editing prisma/schema.prisma

# frontend/
bun run lint           # oxlint
bun run build          # production web / PWA build to dist/
bun run build:ios      # build and sync the Capacitor iOS project, then open frontend/ios/App in Xcode
```

## Production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

This runs the backend from the code built into the image, with no watch mode and no source mounts, and applies migrations when it starts. The frontend is a static build (`frontend/dist`) that you can serve from any web server or reverse proxy.

## API

The backend API is public and has no authentication. Every endpoint is documented in **[API_DOCS.md](API_DOCS.md)**: the data model, REST routes, SSE and WebSocket events, and the speech-to-text protocol. Other La Suite apps can use it to push tasks into Jalon.

## Project layout

```
backend/
  prisma/            schema + migrations
  src/index.ts       HTTP / SSE / WebSocket routes
  src/ai/            Mistral task extraction + Voxtral transcription
frontend/
  src/features/tasks components, hooks, pages, API client
  src/mocks/         /demo page with mock Tchap, Mail and Visio panels
  ios/               Capacitor iOS project (Siri Shortcuts: AddTaskIntent.swift)
```

## Contributing

Issues and pull requests are welcome. Before you open a PR:

1. Run `bun run typecheck` in `backend/` and `bun run lint && bun run build` in `frontend/`.
2. If you change `prisma/schema.prisma`, include the migration.
3. If you change an endpoint, update `API_DOCS.md`.

## License

MIT
