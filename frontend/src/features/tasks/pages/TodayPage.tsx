import { CalendarDays } from "lucide-react";
import { CreateTaskBar } from "../components/CreateTaskBar";
import { DetectedTaskSection } from "../components/DetectedTaskSection";
import { PageHeader } from "../components/PageHeader";
import { SummaryBanner } from "../components/SummaryBanner";
import { TaskSection } from "../components/TaskSection";
import { useDetectedTasks } from "../hooks/useDetectedTasks";
import { useTasks } from "../hooks/useTasks";
import { isDueLaterToday, isDueNowOrPastToday, isDetectedToday } from "../utils/taskFilters";

// Flat list, no collapsible groups (simplified from the 2026-09-16 mockup's
// "À faire maintenant" / "En cours de journée" accordions): due-now tasks
// first, then later today. Detected tasks keep their own card (Keep/Ignore)
// and are listed right below, also without an accordion.
export function TodayPage() {
  const tasks = useTasks();
  const detected = useDetectedTasks();

  const todayTasks = [
    ...(tasks.data ?? []).filter(isDueNowOrPastToday),
    ...(tasks.data ?? []).filter(isDueLaterToday),
  ];
  const detectedToday = (detected.data ?? []).filter(isDetectedToday);

  return (
    <section>
      <PageHeader title="Aujourd'hui" subtitle="Vos priorités du jour" />
      <CreateTaskBar />

      {tasks.isPending && <p>Chargement...</p>}
      {tasks.isError && <p role="alert">Erreur : {tasks.error.message}</p>}

      {tasks.isSuccess && (
        <>
          <SummaryBanner icon={<CalendarDays size={18} aria-hidden="true" />}>
            {todayTasks.length} tâche{todayTasks.length === 1 ? "" : "s"} aujourd'hui
            {detectedToday.length > 0 &&
              ` · ${detectedToday.length} détectée${detectedToday.length === 1 ? "" : "s"} automatiquement`}
          </SummaryBanner>

          <TaskSection tasks={todayTasks} emptyLabel="Rien de prévu aujourd'hui." />

          {detectedToday.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <DetectedTaskSection
                tasks={detectedToday}
                emptyLabel="Aucune tâche détectée pour aujourd'hui."
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
