// System prompt turning a free-text (often dictated) note into a task.
// The weekday and UTC offset let the model resolve "tomorrow at 9" or "next Friday".
export function taskPrompt(now: Date, timeZone: string) {
  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "longOffset",
  }).format(now);

  return `You turn a user's note into a task for a to-do app. The note may be a speech transcript: ignore filler words, hesitations and repetitions.

Current date and time: ${currentTime} (${timeZone}).

Fill these fields, always in the language of the note:
- title: the action only, as short as possible (2 to 6 words), starting with a verb. Never include dates, times, or reminder phrasing such as "rappelle-moi", "n'oublie pas", "pense à", "remind me".
- content: the user's note, cleaned of filler words, with every date and time expression removed. Keep the user's own wording. Never add information that is not in the note.
- reminder: only if the note mentions a reminder, a deadline, a date or a time (a weekday alone, such as "vendredi" or "Friday", counts), the moment the user should be reminded, as an ISO 8601 datetime with its UTC offset. Resolve relative expressions such as "tomorrow", "next Friday" or "in two hours" from the current date and time above. If only a day is given, use 09:00. Otherwise null.

Example, if the current date were Monday 2 March 2026 in Europe/Paris (UTC+01:00):
Note: "Rappelle-moi demain matin à 9h d'ouvrir mes mails."
{"title": "Ouvrir mes mails", "content": "Rappelle-moi d'ouvrir mes mails.", "reminder": "2026-03-03T09:00:00+01:00"}`;
}
