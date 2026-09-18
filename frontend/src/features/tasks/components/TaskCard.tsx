import { Checkbox } from "@gouvfr-lasuite/cunningham-react";
import { CalendarDays, Check, Clock, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { Task } from "../types/task";
import { getCompletedBadge, getDueBadge } from "../utils/formatDueDate";
import { CardMenu } from "./CardMenu";
import { ProvenanceBadge } from "./ProvenanceBadge";
import "./TaskCard.css";

export function TaskCard({
  task,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggleDone: (done: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const completed = task.status === "completed";
  // Completed cards show when the task was finished instead of its (now
  // moot) due date — "Terminées" reference mockup, 2026-09-16.
  const badge = completed ? getCompletedBadge(task.updatedAt) : task.dueAt ? getDueBadge(task.dueAt) : null;
  const BadgeIcon = badge?.icon === "clock" ? Clock : badge?.icon === "check" ? Check : CalendarDays;

  return (
    <li className={"task-card" + (completed ? " task-card--completed" : "")}>
      <Checkbox
        aria-label={
          completed
            ? `Marquer « ${task.title} » comme à faire`
            : `Marquer « ${task.title} » comme terminée`
        }
        checked={completed}
        onChange={(e) => onToggleDone(e.target.checked)}
      />

      <div className="task-card__body">
        <p className="task-card__title">{task.title}</p>
        {badge && (
          <span
            className={
              "task-card__due" +
              ("urgent" in badge && badge.urgent ? " task-card__due--urgent" : "") +
              (completed ? " task-card__due--completed" : "")
            }
          >
            <BadgeIcon size={12} aria-hidden="true" />
            {badge.label}
          </span>
        )}
      </div>

      {/* Source badge + kebab menu, top-right of the card — docs/UX_UI.md's
          original description of the Inbox mockup ("top-right of the
          card"), never actually matched by the earlier inline-next-to-title
          placement; aligned here to match, confirmed again by the newer
          "Aujourd'hui" reference mockup (2026-09-16). */}
      <div className="task-card__side">
        {task.source && <ProvenanceBadge source={task.source} />}
        {completed && (
          // Same action the checkbox already does (onToggleDone(false)) —
          // just a more discoverable affordance, not a replacement for it.
          // "Terminées" reference mockup, 2026-09-16.
          <button type="button" className="task-card__restore" onClick={() => onToggleDone(false)}>
            <RotateCcw size={14} aria-hidden="true" />
            Restaurer
          </button>
        )}
        <CardMenu
          ariaLabel="Actions sur la tâche"
          items={[
            { label: "Modifier", icon: <Pencil size={16} />, onClick: onEdit },
            { label: "Supprimer", icon: <Trash2 size={16} />, onClick: onDelete, danger: true },
          ]}
        />
      </div>
    </li>
  );
}
