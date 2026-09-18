// Desired domain model (docs/DOMAIN_MODEL.md) — the only shape components/hooks
// above the adapter boundary should ever see. Never import BackendTask here.

export type TaskStatus = "todo" | "completed";

export type TaskOrigin = "manual" | "integration" | "automatic";

export type TaskDetectionStatus = "detected" | "confirmed" | "ignored";

export type TaskSourceApp = "tchap" | "mail" | "visio" | "docs";

export type TaskSource = {
  app: TaskSourceApp;
  label?: string;
  externalId?: string;
  url?: string;
  excerpt?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueAt?: string;
  origin: TaskOrigin;
  detectionStatus?: TaskDetectionStatus;
  source?: TaskSource;
  createdAt: string;
  updatedAt: string;
};

// Domain-shaped patch accepted by useUpdateTask; taskPatchToBackendPatch
// converts it to the wire format. `dueAt` takes a real Date so the adapter
// serializes via .toISOString() — never a hand-built string (see
// docs/API_CONTRACT.md, "Date format": an offset-less datetime is a 422).
export type TaskPatch = {
  title?: string;
  description?: string | null;
  dueAt?: Date | null;
  status?: TaskStatus;
  detectionStatus?: TaskDetectionStatus | null;
};
