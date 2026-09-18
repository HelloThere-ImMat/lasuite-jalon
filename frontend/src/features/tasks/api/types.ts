// Mirrors the backend's actual Task shape exactly — see API_DOCS.md.
// Nothing above the api/ and utils/adapters.ts layers should import this file
// directly — go through the domain Task type (features/tasks/types/task.ts)
// instead (docs/ARCHITECTURE.md).

export type BackendTaskOrigin = "APP" | "TCHAP" | "DOCS" | "MAIL" | "VISIO";

export type BackendTaskDetectionStatus = "DETECTED" | "CONFIRMED" | "IGNORED";

export type BackendTask = {
  id: string;
  title: string;
  content: string | null;
  reminder: string | null;
  done: boolean;
  validated: boolean;
  userId: string | null;
  origin: BackendTaskOrigin;
  detectionStatus: BackendTaskDetectionStatus | null;
  sourceLabel: string | null;
  sourceExternalId: string | null;
  sourceUrl: string | null;
  sourceExcerpt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateBackendTaskInput = {
  title?: string;
  content?: string | null;
  reminder?: string | null;
  done?: boolean;
  validated?: boolean;
  detectionStatus?: BackendTaskDetectionStatus | null;
};

export type CreateFromTextInput = {
  text: string;
  timeZone?: string;
};
