import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, ModalSize, TextArea } from "@gouvfr-lasuite/cunningham-react";
import { editTaskSchema, toDateTimeLocalValue, type EditTaskFormValues } from "../schemas/editTask";
import type { Task } from "../types/task";
import { ProvenanceBadge } from "./ProvenanceBadge";
import "./EditTaskModal.css";

const FORM_ID = "edit-task-form";

// Fields use Cunningham's "classic" variant (label always above the field):
// the default "floating" variant only tracks the value through its own
// onChange/defaultValue, so after react-hook-form's reset() filled the input
// the label stayed rendered as a placeholder on top of the real value.
export function EditTaskModal({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (values: EditTaskFormValues) => void;
}) {
  const { register, handleSubmit, reset, formState } = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: { title: "", description: "", reminder: "" },
  });

  useEffect(() => {
    if (task) reset({
        title: task.title,
        description: task.description ?? "",
        reminder: toDateTimeLocalValue(task.dueAt),
      });
  }, [task, reset]);

  const onSubmit = handleSubmit((values) => onSave(values));

  return (
    <Modal
      isOpen={task !== null}
      onClose={onClose}
      size={ModalSize.MEDIUM}
      title="Modifier la tâche"
      rightActions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={FORM_ID}>
            Enregistrer
          </Button>
        </>
      }
    >
      {task?.source && (
        <div className="edit-task-provenance">
          <ProvenanceBadge source={task.source} />
          {task.source.excerpt && <blockquote>{task.source.excerpt}</blockquote>}
          {task.source.url && (
            <a href={task.source.url} target="_blank" rel="noreferrer">
              Voir la source
            </a>
          )}
        </div>
      )}

      <form id={FORM_ID} onSubmit={onSubmit} className="edit-task-form">
        <Input
          label="Titre"
          variant="classic"
          fullWidth
          {...register("title")}
          state={formState.errors.title ? "error" : "default"}
          text={formState.errors.title?.message}
        />
        <TextArea
          label="Description"
          variant="classic"
          rows={4}
          fullWidth
          {...register("description")}
        />
        <Input
          label="Rappel"
          variant="classic"
          type="datetime-local"
          fullWidth
          {...register("reminder")}
          state={formState.errors.reminder ? "error" : "default"}
          text={formState.errors.reminder?.message ?? "Laisser vide pour aucun rappel"}
        />
      </form>
    </Modal>
  );
}
