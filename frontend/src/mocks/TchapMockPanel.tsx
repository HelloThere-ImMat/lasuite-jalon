import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useCreateTask } from "../features/tasks/hooks/useCreateTask";
import { TCHAP_MOCK_MESSAGES, type TchapMockMessage } from "./mockData";
import "./MockPanel.css";

// docs/DEMO_SCENARIOS.md, scenario 2: explicit integration — "Ajouter à
// Jalon" creates a normal, immediately-confirmed task (no detectionStatus),
// unlike the Mail/Visio "detected" flow. The backend can't store the Tchap
// origin/source yet (no POST /tasks, API_DOCS.md), so it shows as a manual task.
export function TchapMockPanel() {
  const createTask = useCreateTask();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAdd = (message: TchapMockMessage) => {
    createTask.mutate(
      { text: message.text },
      { onSuccess: () => setAddedIds((prev) => new Set(prev).add(message.id)) },
    );
  };

  return (
    <section className="mock-panel">
      <h2 className="mock-panel__heading">
        <MessageSquare size={20} /> Tchap (mock)
      </h2>
      <p className="mock-panel__hint">
        Action explicite : la tâche est créée confirmée immédiatement, pas détectée.
      </p>
      <ul className="mock-panel__list">
        {TCHAP_MOCK_MESSAGES.map((message) => {
          const added = addedIds.has(message.id);
          return (
            <li key={message.id} className="mock-message">
              <div className="mock-message__body">
                <p className="mock-message__meta">
                  {message.sender} · {message.channel}
                </p>
                <p className="mock-message__text">{message.text}</p>
              </div>
              <button
                type="button"
                className="mock-message__action"
                disabled={added || createTask.isPending}
                onClick={() => handleAdd(message)}
              >
                {added ? "Ajoutée ✓" : "Ajouter à Jalon"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
