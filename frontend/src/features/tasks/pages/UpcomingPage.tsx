import { CalendarDays } from "lucide-react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { CreateTaskBar } from "../components/CreateTaskBar";
import { PageHeader } from "../components/PageHeader";
import { SummaryBanner } from "../components/SummaryBanner";
import { TaskSection } from "../components/TaskSection";
import { useTasks } from "../hooks/useTasks";
import { isDueLaterTask, isDueThisWeekTask, isDueTomorrowTask } from "../utils/taskFilters";

// Grouped into "Demain" / "Cette semaine" / "Plus tard" — new reference
// mockup (2026-09-16), see docs/audits/upcoming-page-redesign.md. Same icon
// (CalendarDays) for all three sections, matching the mockup — unlike
// Today's page, which used a different icon per section.
export function UpcomingPage() {
  const tasks = useTasks();

  const tomorrow = (tasks.data ?? []).filter(isDueTomorrowTask);
  const thisWeek = (tasks.data ?? []).filter(isDueThisWeekTask);
  const later = (tasks.data ?? []).filter(isDueLaterTask);
  const total = tomorrow.length + thisWeek.length + later.length;

  return (
    <section>
      <PageHeader title="À venir" subtitle="Anticipez les prochains jours" />
      <CreateTaskBar />

      {tasks.isPending && <p>Chargement...</p>}
      {tasks.isError && <p role="alert">Erreur : {tasks.error.message}</p>}

      {tasks.isSuccess && (
        <>
          <SummaryBanner icon={<CalendarDays size={18} aria-hidden="true" />}>
            {total} tâche{total === 1 ? "" : "s"} à venir
            {thisWeek.length > 0 && ` · ${thisWeek.length} cette semaine`}
          </SummaryBanner>

          <CollapsibleSection icon={<CalendarDays size={20} />} title="Demain" count={tomorrow.length}>
            <TaskSection tasks={tomorrow} emptyLabel="Rien de prévu demain." />
          </CollapsibleSection>

          <CollapsibleSection
            icon={<CalendarDays size={20} />}
            title="Cette semaine"
            count={thisWeek.length}
          >
            <TaskSection tasks={thisWeek} emptyLabel="Rien de prévu cette semaine." />
          </CollapsibleSection>

          <CollapsibleSection icon={<CalendarDays size={20} />} title="Plus tard" count={later.length}>
            <TaskSection tasks={later} emptyLabel="Rien de prévu plus tard." />
          </CollapsibleSection>
        </>
      )}
    </section>
  );
}
