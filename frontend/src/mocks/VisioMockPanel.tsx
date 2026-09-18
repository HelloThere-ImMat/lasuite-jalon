import { useState } from "react";
import { Video } from "lucide-react";
import { useCreateTask } from "../features/tasks/hooks/useCreateTask";
import { VISIO_MOCK_MEETINGS, type VisioMockMeeting } from "./mockData";
import "./MockPanel.css";

// docs/DEMO_SCENARIOS.md, scenario 4: same detected-task flow as Mail, but
// one transcript can produce more than one suggested task.
export function VisioMockPanel() {
  const createTask = useCreateTask();
  const [detectedIds, setDetectedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const handleDetect = async (meeting: VisioMockMeeting) => {
    setPendingIds((prev) => new Set(prev).add(meeting.id));
    try {
      // Wait for every task in this transcript to actually be created before
      // marking it "done" — firing all the mutations and flipping the button
      // immediately (not waiting on the result) was tried first and would
      // mark a transcript "detected" even if one of its tasks failed to save.
      await Promise.all(
        meeting.detected.map((item) => {
          const line = meeting.transcript[item.excerptLine];
          return createTask.mutateAsync({
            text: `${meeting.title}\n${line.speaker} : ${line.text}`,
            detectionStatus: "DETECTED",
          });
        }),
      );
      setDetectedIds((prev) => new Set(prev).add(meeting.id));
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(meeting.id);
        return next;
      });
    }
  };

  return (
    <section className="mock-panel">
      <h2 className="mock-panel__heading">
        <Video size={20} /> Visio (mock)
      </h2>
      <p className="mock-panel__hint">
        « Détecter les actions » simule l'extraction IA sur la transcription — peut produire
        plusieurs tâches détectées à la fois.
      </p>
      <ul className="mock-panel__list">
        {VISIO_MOCK_MEETINGS.map((meeting) => {
          const detected = detectedIds.has(meeting.id);
          const pending = pendingIds.has(meeting.id);
          return (
            <li key={meeting.id} className="mock-transcript">
              <p className="mock-message__meta">{meeting.title}</p>
              {meeting.transcript.map((line, index) => (
                <p key={index} className="mock-transcript__line">
                  <strong>{line.speaker}</strong> : {line.text}
                </p>
              ))}
              <div className="mock-transcript__actions">
                <button
                  type="button"
                  className="mock-message__action"
                  disabled={detected || pending}
                  onClick={() => handleDetect(meeting)}
                >
                  {detected ? "Actions détectées ✓" : pending ? "Détection..." : "Détecter les actions"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
