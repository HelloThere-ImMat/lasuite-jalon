import type {
  BackendTask,
  CreateFromTextInput,
  UpdateBackendTaskInput,
} from "./types";

// Deployed backend, see API_DOCS.md. Override with VITE_API_BASE / VITE_WS_BASE
// (e.g. http://localhost:3001/api for a local backend).
const DEPLOYED_API_BASE = "https://nudge.ovh/api/lasuite-jalon";

// HTTP goes through Vite's dev proxy in dev (the server's CORS allowlist only
// has http://localhost:3000, not the Vite port), straight to the backend in
// builds.
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.DEV ? "/api" : DEPLOYED_API_BASE);

// WebSockets aren't subject to CORS, so they always connect straight to the
// backend — also sidesteps Vite's WS proxy crashing under Bun.
const WS_BASE = (
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? DEPLOYED_API_BASE
).replace(/^http/, "ws");

export const wsUrl = (path: string) => `${WS_BASE}${path}`;

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Backend-shaped calls only — see API_DOCS.md. There is no POST /tasks:
// from-text is the only way to create a task. Nothing here knows
// about the frontend's domain Task type; that conversion happens in the
// adapter layer (features/tasks/utils/adapters.ts, Milestone 2).
export const tasksApi = {
  list: () => request<BackendTask[]>("/tasks"),

  // Creates the task from raw free text (typed or dictated); the AI rewrites
  // title/content/reminder in the background, pushed over WS /tasks/live —
  // see docs/DECISIONS.md, "Task creation UI: single free-text field + dictation".
  createFromText: (input: CreateFromTextInput) =>
    request<BackendTask>("/tasks/from-text", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdateBackendTaskInput) =>
    request<BackendTask>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<BackendTask>(`/tasks/${id}`, { method: "DELETE" }),
};

export { ApiError };
