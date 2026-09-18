import { z } from "zod";

// `reminder` is the raw <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm",
// local time, or "" for none). It's turned into a real Date before reaching
// the adapter, which serializes with .toISOString() (docs/API_CONTRACT.md,
// "Date format": an offset-less datetime is a 422).
export const editTaskSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  description: z.string().trim(),
  reminder: z
    .string()
    .refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), "Date invalide"),
});

export type EditTaskFormValues = z.infer<typeof editTaskSchema>;

// ISO string -> local "YYYY-MM-DDTHH:mm" for a datetime-local input.
export function toDateTimeLocalValue(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
