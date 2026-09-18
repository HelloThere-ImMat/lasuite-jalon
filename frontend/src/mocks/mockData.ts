import type { Day } from "date-fns";

// Hardcoded, deterministic mock content per docs/DEMO_SCENARIOS.md — "fine
// to fake": the Tchap/Mail/Visio UIs and their "AI extraction" logic. No
// real LLM call here; this is not the same thing as the real Mistral
// extraction in backend/src/ai/ (that's the quick-add bar's flow).

export type TchapMockMessage = {
  id: string;
  sender: string;
  channel: string;
  text: string;
};

export const TCHAP_MOCK_MESSAGES: TchapMockMessage[] = [
  {
    id: "tchap-1",
    sender: "Fatima",
    channel: "#projet-widget",
    text: "Peux-tu répondre à Aynar avant la fin de journée ?",
  },
  {
    id: "tchap-2",
    sender: "Karim",
    channel: "#support",
    text: "Il faudrait relancer le prestataire pour le contrat.",
  },
];

// 0=Sunday..6=Saturday (matches JS Date#getDay()) — resolved via date-fns's
// nextDay() to whichever real calendar date is the *next* occurrence of that
// weekday, so the fake message text ("avant vendredi") always narratively
// matches the resulting task's due-date pill, regardless of which real day
// the demo happens to run on. A fixed day-offset (dueInDays) was tried first
// and was wrong as soon as "today" wasn't the exact day it was written for
// — confirmed live: "avant vendredi" produced a task due "jeudi".
export type MailMockMessage = {
  id: string;
  sender: string;
  subject: string;
  body: string;
  // What the mock "AI extraction" deterministically produces.
  detected: { title: string; dueWeekday: Day };
};

export const MAIL_MOCK_MESSAGES: MailMockMessage[] = [
  {
    id: "mail-1",
    sender: "Fatima",
    subject: "Dossier Aynar",
    body: "Peux-tu envoyer le dossier à Aynar avant vendredi ?",
    detected: { title: "Envoyer le dossier à Aynar", dueWeekday: 5 }, // vendredi
  },
];

export type VisioMockTranscriptLine = { speaker: string; text: string };

export type VisioMockMeeting = {
  id: string;
  title: string;
  transcript: VisioMockTranscriptLine[];
  // What the mock "AI extraction" deterministically produces — can be
  // more than one suggested task per meeting.
  detected: { title: string; dueWeekday: Day; excerptLine: number }[];
};

export const VISIO_MOCK_MEETINGS: VisioMockMeeting[] = [
  {
    id: "visio-1",
    title: "Point équipe hebdo",
    transcript: [
      { speaker: "Imane", text: "Mathias, peux-tu préparer la présentation pour jeudi ?" },
      { speaker: "Mathias", text: "Oui, je m'en occupe." },
      { speaker: "Imane", text: "Et il faudrait aussi relire les specs avant la prochaine réunion." },
    ],
    detected: [
      { title: "Préparer la présentation", dueWeekday: 4, excerptLine: 0 }, // jeudi
      { title: "Relire les specs", dueWeekday: 1, excerptLine: 2 }, // lundi (no day named in text)
    ],
  },
];
