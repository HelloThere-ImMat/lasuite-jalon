import { Check, Pencil, X } from "lucide-react";
import type { Task } from "../types/task";
import { CardMenu } from "./CardMenu";
import { formatDueDate } from "../utils/formatDueDate";
import { parseExcerpt } from "../utils/formatExcerpt";
import { ProvenanceBadge } from "./ProvenanceBadge";
import "./DetectedTaskCard.css";

const APP_LABEL: Record<string, string> = { tchap: "Tchap", mail: "Mail", visio: "Visio", docs: "Docs" };

export function DetectedTaskCard({
  task,
  onKeepAndComplete,
  onKeep,
  onIgnore,
  onEdit,
}: {
  task: Task;
  onKeepAndComplete: () => void;
  onKeep: () => void;
  onIgnore: () => void;
  onEdit: () => void;
}) {
  const { speaker, message } = task.source?.excerpt
    ? parseExcerpt(task.source.excerpt)
    : { speaker: null, message: null };

  return (
    <li className="detected-task-card">
      <div className="detected-task-card__top">
        <button
          type="button"
          className="detected-task-card__checkbox"
          onClick={onKeepAndComplete}
          aria-label={`Garder et marquer « ${task.title} » comme terminée`}
        />
        <p className="detected-task-card__title">{task.title}</p>
        {task.source && <ProvenanceBadge source={task.source} />}
        <CardMenu
          ariaLabel="Actions sur la tâche"
          items={[{ label: "Modifier", icon: <Pencil size={16} />, onClick: onEdit }]}
        />
      </div>

      {task.dueAt && task.source && (
        <span className="detected-task-card__pill">
          {formatDueDate(task.dueAt)} · {APP_LABEL[task.source.app]}
        </span>
      )}

      {message && (
        <p className="detected-task-card__excerpt">
          « {speaker && <strong>{speaker}</strong>}
          {speaker && " : "}
          {message} »
        </p>
      )}

      <div className="detected-task-card__actions">
        <button type="button" className="detected-task-card__keep" onClick={onKeep}>
          <Check size={16} /> Garder
        </button>
        <button type="button" className="detected-task-card__ignore" onClick={onIgnore}>
          <X size={16} /> Ignorer
        </button>
      </div>
    </li>
  );
}
