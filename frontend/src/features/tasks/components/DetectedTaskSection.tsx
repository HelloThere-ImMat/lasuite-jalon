import { useState } from "react";
import { useUpdateTask } from "../hooks/useUpdateTask";
import type { Task } from "../types/task";
import { DetectedTaskCard } from "./DetectedTaskCard";
import { EditTaskModal } from "./EditTaskModal";

// Milestone 4: Keep/Ignore/Edit for AI-detected tasks (docs/PRODUCT.md,
// docs/DECISIONS.md "Detection status"). Separate from TaskSection because
// the available actions and their backend effect are different (no delete,
// no plain complete-toggle — the checkbox here means "Keep + mark done" in
// one gesture, decided explicitly since the mockup left it ambiguous).
export function DetectedTaskSection({ tasks, emptyLabel }: { tasks: Task[]; emptyLabel: string }) {
  const updateTask = useUpdateTask();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return <p className="task-list__empty">{emptyLabel}</p>;
  }

  return (
    <>
      <ul className="task-list">
        {tasks.map((task) => (
          <DetectedTaskCard
            key={task.id}
            task={task}
            onKeepAndComplete={() =>
              updateTask.mutate({
                id: task.id,
                patch: { detectionStatus: "confirmed", status: "completed" },
              })
            }
            onKeep={() =>
              updateTask.mutate({ id: task.id, patch: { detectionStatus: "confirmed" } })
            }
            onIgnore={() =>
              updateTask.mutate({ id: task.id, patch: { detectionStatus: "ignored" } })
            }
            onEdit={() => setEditingTask(task)}
          />
        ))}
      </ul>

      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={(values) => {
          if (!editingTask) return;
          // Edit-before-confirm: field edits + the Keep transition in one
          // save, per docs/DECISIONS.md ("Detection status").
          updateTask.mutate({
            id: editingTask.id,
            patch: {
              title: values.title,
              description: values.description.trim() ? values.description : null,
              dueAt: values.reminder ? new Date(values.reminder) : null,
              detectionStatus: "confirmed",
            },
          });
          setEditingTask(null);
        }}
      />
    </>
  );
}
