import type { Task } from "../types/task";
import { TaskCard } from "./TaskCard";
import "./TaskList.css";

export function TaskList({
  tasks,
  emptyLabel,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  emptyLabel: string;
  onToggleDone: (task: Task, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return <p className="task-list__empty">{emptyLabel}</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleDone={(done) => onToggleDone(task, done)}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
        />
      ))}
    </ul>
  );
}
