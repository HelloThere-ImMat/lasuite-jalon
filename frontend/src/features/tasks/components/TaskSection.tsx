import { useState } from "react";
import { useModals } from "@gouvfr-lasuite/cunningham-react";
import { useDeleteTask } from "../hooks/useDeleteTask";
import { useUpdateTask } from "../hooks/useUpdateTask";
import type { Task } from "../types/task";
import { EditTaskModal } from "./EditTaskModal";
import { TaskList } from "./TaskList";

// Shared complete/edit/delete wiring for a filtered task list — used by
// Inbox, Today, Upcoming and Completed so the interaction logic isn't
// duplicated across pages (docs/DECISIONS.md, "Milestone 3 scope").
export function TaskSection({ tasks, emptyLabel }: { tasks: Task[]; emptyLabel: string }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const modals = useModals();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleToggleDone = (task: Task, done: boolean) => {
    updateTask.mutate({ id: task.id, patch: { status: done ? "completed" : "todo" } });
  };

  const handleDelete = async (task: Task) => {
    const decision = await modals.deleteConfirmationModal({
      title: "Supprimer la tâche ?",
      children: <p>« {task.title} » sera définitivement supprimée.</p>,
    });
    if (decision) deleteTask.mutate(task.id);
  };

  return (
    <>
      <TaskList
        tasks={tasks}
        emptyLabel={emptyLabel}
        onToggleDone={handleToggleDone}
        onEdit={setEditingTask}
        onDelete={handleDelete}
      />

      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={(values) => {
          if (!editingTask) return;
          updateTask.mutate({
            id: editingTask.id,
            patch: {
              title: values.title,
              description: values.description.trim() ? values.description : null,
              dueAt: values.reminder ? new Date(values.reminder) : null,
            },
          });
          setEditingTask(null);
        }}
      />
    </>
  );
}
