import { CalendarDays, CircleCheck, Sparkles } from "lucide-react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { CreateTaskBar } from "../components/CreateTaskBar";
import { DetectedTaskSection } from "../components/DetectedTaskSection";
import { PageHeader } from "../components/PageHeader";
// import { SearchBar } from "../components/SearchBar"; // not used for now
import { TaskSection } from "../components/TaskSection";
import { useDetectedTasks } from "../hooks/useDetectedTasks";
import { useToTreatTasks } from "../hooks/useToTreatTasks";
import { useUpcomingTasks } from "../hooks/useUpcomingTasks";

export function InboxPage() {
  const toTreat = useToTreatTasks();
  const detected = useDetectedTasks();
  const upcoming = useUpcomingTasks();

  return (
    <section>
      <PageHeader
        title="Boite de reception"
        subtitle="Vos tâches, centralisés"
      />
      <CreateTaskBar />
      {/* <SearchBar /> — not used for now */}

      {toTreat.isPending && <p>Chargement...</p>}
      {toTreat.isError && <p role="alert">Erreur : {toTreat.error.message}</p>}

      {toTreat.isSuccess && (
        <CollapsibleSection
          icon={<CircleCheck size={20} />}
          title="À traiter"
          count={(toTreat.data ?? []).length}
        >
          <TaskSection
            tasks={toTreat.data ?? []}
            emptyLabel="Aucune tâche à traiter."
          />
        </CollapsibleSection>
      )}

      {detected.isSuccess && (
        <CollapsibleSection
          icon={<Sparkles size={20} />}
          title="Détectées automatiquement"
          count={(detected.data ?? []).length}
        >
          <DetectedTaskSection
            tasks={detected.data ?? []}
            emptyLabel="Aucune tâche détectée pour le moment."
          />
        </CollapsibleSection>
      )}

      {upcoming.isSuccess && (
        <CollapsibleSection
          icon={<CalendarDays size={20} />}
          title="À venir"
          count={(upcoming.data ?? []).length}
        >
          <TaskSection
            tasks={upcoming.data ?? []}
            emptyLabel="Aucune tâche à venir."
          />
        </CollapsibleSection>
      )}
    </section>
  );
}
