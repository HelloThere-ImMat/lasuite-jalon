// The only place in the frontend allowed to know the backend's field names/enum
// values (docs/ARCHITECTURE.md). Everything else works with the domain Task type.

import type {
  BackendTask,
  BackendTaskDetectionStatus,
  BackendTaskOrigin,
  UpdateBackendTaskInput,
} from "../api/types";
import type { Task, TaskDetectionStatus, TaskPatch, TaskSource } from "../types/task";

const SOURCE_APP_BY_ORIGIN: Record<Exclude<BackendTaskOrigin, "APP">, TaskSource["app"]> = {
  TCHAP: "tchap",
  DOCS: "docs",
  MAIL: "mail",
  VISIO: "visio",
};

const DETECTION_STATUS_TO_DOMAIN: Record<BackendTaskDetectionStatus, TaskDetectionStatus> = {
  DETECTED: "detected",
  CONFIRMED: "confirmed",
  IGNORED: "ignored",
};

const DETECTION_STATUS_TO_BACKEND: Record<TaskDetectionStatus, BackendTaskDetectionStatus> = {
  detected: "DETECTED",
  confirmed: "CONFIRMED",
  ignored: "IGNORED",
};

function toSource(backend: BackendTask): TaskSource | undefined {
  if (backend.origin === "APP") return undefined;
  return {
    app: SOURCE_APP_BY_ORIGIN[backend.origin],
    label: backend.sourceLabel ?? undefined,
    externalId: backend.sourceExternalId ?? undefined,
    url: backend.sourceUrl ?? undefined,
    excerpt: backend.sourceExcerpt ?? undefined,
  };
}

export function backendTaskToTask(backend: BackendTask): Task {
  return {
    id: backend.id,
    title: backend.title,
    description: backend.content ?? undefined,
    status: backend.done ? "completed" : "todo",
    dueAt: backend.reminder ?? undefined,
    origin:
      backend.origin === "APP" ? "manual" : backend.detectionStatus ? "automatic" : "integration",
    detectionStatus: backend.detectionStatus
      ? DETECTION_STATUS_TO_DOMAIN[backend.detectionStatus]
      : undefined,
    source: toSource(backend),
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
  };
}

export function taskPatchToBackendPatch(patch: TaskPatch): UpdateBackendTaskInput {
  const backendPatch: UpdateBackendTaskInput = {};
  if (patch.title !== undefined) backendPatch.title = patch.title;
  if (patch.description !== undefined) backendPatch.content = patch.description;
  if (patch.dueAt !== undefined) {
    backendPatch.reminder = patch.dueAt ? patch.dueAt.toISOString() : null;
  }
  if (patch.status !== undefined) backendPatch.done = patch.status === "completed";
  if (patch.detectionStatus !== undefined) {
    backendPatch.detectionStatus = patch.detectionStatus
      ? DETECTION_STATUS_TO_BACKEND[patch.detectionStatus]
      : null;
  }
  return backendPatch;
}
