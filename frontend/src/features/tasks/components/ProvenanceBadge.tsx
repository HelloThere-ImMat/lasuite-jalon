import { FileText, Mail, MessageSquare, Video } from "lucide-react";
import type { TaskSource } from "../types/task";
import "./ProvenanceBadge.css";

const ICON_BY_APP: Record<TaskSource["app"], typeof MessageSquare> = {
  tchap: MessageSquare,
  mail: Mail,
  visio: Video,
  docs: FileText,
};

const LABEL_BY_APP: Record<TaskSource["app"], string> = {
  tchap: "Tchap",
  mail: "Mail",
  visio: "Visio",
  docs: "Docs",
};

export function ProvenanceBadge({ source }: { source: TaskSource }) {
  const AppIcon = ICON_BY_APP[source.app];
  return (
    <span className="provenance-badge">
      <span className="provenance-badge__icon" aria-hidden="true">
        <AppIcon />
      </span>
      <span className="provenance-badge__label">{source.label ?? LABEL_BY_APP[source.app]}</span>
    </span>
  );
}
