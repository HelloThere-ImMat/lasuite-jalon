import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mic, Plus, Square } from "lucide-react";
import { useCreateTaskFromText } from "../hooks/useCreateTaskFromText";
import { useDictation } from "../hooks/useDictation";
import { createTaskSchema, type CreateTaskFormValues } from "../schemas/createTask";
import "./CreateTaskBar.css";

// Single pill-shaped bar (mic, divider, input, "+") per docs/DECISIONS.md,
// "Quick-add bar stays always-visible, no modal/sheet" and
// docs/UX_UI.md "Updated reference (v2)". A plain native <input> here
// (not Cunningham's Input) since this is one bespoke composite control,
// not a standard labeled field — same precedent as the icon-only kebab
// trigger in TaskCard.tsx. Submits on Enter, and the "+" is also a real
// submit button — on a real installed iPhone PWA the "+" being purely
// decorative (its original, docs/DECISIONS.md-documented form) read as a
// broken "add" button, since there's no other visible affordance to tap.
export function CreateTaskBar() {
  const createTask = useCreateTaskFromText();
  const [dictationError, setDictationError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { text: "" },
  });

  const dictation = useDictation({
    onText: (text) => setValue("text", text, { shouldValidate: true }),
    onError: setDictationError,
  });

  const toggleDictation = () => {
    if (dictation.recording) {
      dictation.stop();
      return;
    }
    setDictationError(null);
    dictation.start().catch((error: unknown) => setDictationError(String(error)));
  };

  const onSubmit = handleSubmit(({ text }) => {
    createTask.mutate(text, { onSuccess: () => reset() });
  });

  const { ref: textFieldRef, ...textFieldProps } = register("text");

  return (
    <div className="create-task-bar">
      <form onSubmit={onSubmit} className="create-task-bar__pill">
        <button
          type="button"
          className={
            "create-task-bar__badge create-task-bar__badge--button" +
            (dictation.recording ? " create-task-bar__badge--recording" : "")
          }
          onClick={toggleDictation}
          aria-label={dictation.recording ? "Arrêter la dictée" : "Dicter la tâche"}
        >
          {dictation.recording ? <Square size={18} /> : <Mic size={18} />}
        </button>
        <span className="create-task-bar__divider" aria-hidden="true" />
        <input
          {...textFieldProps}
          ref={textFieldRef}
          type="text"
          className="create-task-bar__input"
          placeholder="Ajouter une tâche rapidement..."
          aria-label="Nouvelle tâche"
        />
        <button
          type="submit"
          className="create-task-bar__badge create-task-bar__badge--button"
          aria-label="Ajouter la tâche"
        >
          <Plus size={18} />
        </button>
      </form>

      {formState.errors.text && (
        <p className="create-task-bar__error" role="alert">
          {formState.errors.text.message}
        </p>
      )}
      {dictationError && (
        <p className="create-task-bar__error" role="alert">
          {dictationError}
        </p>
      )}
      {createTask.isError && (
        <p className="create-task-bar__error" role="alert">
          Erreur : {createTask.error.message}
        </p>
      )}
    </div>
  );
}
