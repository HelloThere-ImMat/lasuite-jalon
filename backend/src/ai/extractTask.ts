import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { taskPrompt } from "./taskPrompt";

const MODEL = "mistral-small-latest";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const TaskDraft = z.object({
  title: z.string(),
  content: z.string(),
  reminder: z.string().nullable(),
});

// Turns a free-text note into the AI-owned task fields; the backend sets the rest
export async function extractTask(text: string, timeZone = "Europe/Paris") {
  const response = await mistral.chat.parse({
    model: MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: taskPrompt(new Date(), timeZone) },
      { role: "user", content: text },
    ],
    responseFormat: TaskDraft,
  });

  // The SDK types `parsed` loosely, so validate it against the schema
  const draft = TaskDraft.parse(response.choices?.[0]?.message?.parsed);

  const reminder = draft.reminder ? new Date(draft.reminder) : null;
  return {
    title: draft.title.slice(0, 80),
    content: draft.content || null,
    reminder: reminder && !Number.isNaN(reminder.getTime()) ? reminder : null,
  };
}
