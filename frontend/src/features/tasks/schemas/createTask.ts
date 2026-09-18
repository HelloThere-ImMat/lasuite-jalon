import { z } from "zod";

// Single free-text field — see docs/DECISIONS.md,
// "Task creation UI: single free-text field + dictation".
export const createTaskSchema = z.object({
  text: z.string().trim().min(1, "Décris ta tâche"),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
