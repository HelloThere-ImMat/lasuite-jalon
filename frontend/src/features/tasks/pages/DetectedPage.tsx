import { DetectedTaskSection } from "../components/DetectedTaskSection";
import { useDetectedTasks } from "../hooks/useDetectedTasks";

// A direct deep link to "Détectées automatiquement" (brief §11), which
// otherwise only lives as an Inbox section (docs/UX_UI.md, docs/DECISIONS.md
// "Milestone 3 scope"). Was a static placeholder stub since Milestone 1,
// never wired up once Milestone 4 shipped the real Keep/Ignore/Edit flow —
// found during a suggestions audit, fixed to render the real data through
// the same DetectedTaskSection the Inbox uses.
export function DetectedPage() {
  const detected = useDetectedTasks();

  return (
    <section>
      <h1>Détectées automatiquement</h1>

      {detected.isPending && <p>Chargement...</p>}
      {detected.isError && <p role="alert">Erreur : {detected.error.message}</p>}

      {detected.isSuccess && (
        <DetectedTaskSection
          tasks={detected.data ?? []}
          emptyLabel="Aucune tâche détectée pour le moment."
        />
      )}
    </section>
  );
}
