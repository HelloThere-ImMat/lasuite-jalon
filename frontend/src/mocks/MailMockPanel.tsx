import { useState } from "react";
import { Mail } from "lucide-react";
import { useCreateTask } from "../features/tasks/hooks/useCreateTask";
import { MAIL_MOCK_MESSAGES, type MailMockMessage } from "./mockData";
import "./MockPanel.css";

// docs/DEMO_SCENARIOS.md, scenario 3: "Analyser" sends the mail to the real
// AI extraction (POST /tasks/from-text) and flags the result as a
// detected task (Milestone 4's Keep/Ignore/Edit flow takes it from there).
export function MailMockPanel() {
  const createTask = useCreateTask();
  const [detectedIds, setDetectedIds] = useState<Set<string>>(new Set());

  const handleDetect = (message: MailMockMessage) => {
    createTask.mutate(
      { text: `${message.subject}\n${message.body}`, detectionStatus: "DETECTED" },
      { onSuccess: () => setDetectedIds((prev) => new Set(prev).add(message.id)) },
    );
  };

  return (
    <section className="mock-panel">
      <h2 className="mock-panel__heading">
        <Mail size={20} /> Mail (mock)
      </h2>
      <p className="mock-panel__hint">
        « Analyser » envoie le mail à l'extraction IA — crée une
        tâche détectée à Garder/Ignorer/Modifier.
      </p>
      <ul className="mock-panel__list">
        {MAIL_MOCK_MESSAGES.map((message) => {
          const detected = detectedIds.has(message.id);
          return (
            <li key={message.id} className="mock-message">
              <div className="mock-message__body">
                <p className="mock-message__meta">
                  {message.sender} — {message.subject}
                </p>
                <p className="mock-message__text">{message.body}</p>
              </div>
              <button
                type="button"
                className="mock-message__action"
                disabled={detected || createTask.isPending}
                onClick={() => handleDetect(message)}
              >
                {detected ? "Détectée ✓" : "Analyser"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
