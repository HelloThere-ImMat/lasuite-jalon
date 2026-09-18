import { useState } from "react";
import { Button } from "@gouvfr-lasuite/cunningham-react";
import { Bell, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { CreateTaskBar } from "../components/CreateTaskBar";
import { NotificationSettingsModal } from "../components/NotificationSettingsModal";
import { PageHeader } from "../components/PageHeader";
import { SummaryBanner } from "../components/SummaryBanner";
import { TaskSection } from "../components/TaskSection";
import { useCompletedTasks } from "../hooks/useCompletedTasks";
import {
  isCompletedOlderTask,
  isCompletedThisWeekTask,
  isCompletedTodayTask,
} from "../utils/taskFilters";

// Unchecking a completed task's checkbox here moves it back to its normal
// view (docs/DEMO_SCENARIOS.md, scenario 5) — TaskSection's toggle already
// works both ways; the new "Restaurer" button (TaskCard.tsx) calls the same
// mutation. Grouped into "Aujourd'hui" / "Cette semaine" / "Plus anciennes"
// — new reference mockup, 2026-09-16 — keyed off `updatedAt` as a
// completion-time heuristic (docs/DECISIONS.md has "No completedAt for
// now"; see getCompletedBadge's comment in formatDueDate.ts).
export function CompletedPage() {
  const tasks = useCompletedTasks();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const today = (tasks.data ?? []).filter(isCompletedTodayTask);
  const thisWeek = (tasks.data ?? []).filter(isCompletedThisWeekTask);
  const older = (tasks.data ?? []).filter(isCompletedOlderTask);
  // "Cette semaine" in the summary means today+this-week, not "everything
  // shown on this page" — deliberately not chasing the mockup's static
  // total, which doesn't match its own three visible groups either (same
  // kind of illustrative-number mismatch already found in the Today/À
  // venir mockups).
  const totalThisWeek = today.length + thisWeek.length;

  return (
    <section>
      <PageHeader title="Terminées" subtitle="Le travail déjà accompli" />
      <CreateTaskBar />

      {tasks.isPending && <p>Chargement...</p>}
      {tasks.isError && <p role="alert">Erreur : {tasks.error.message}</p>}

      {tasks.isSuccess && (
        <>
          <SummaryBanner icon={<CheckCircle2 size={18} aria-hidden="true" />}>
            {totalThisWeek} tâche{totalThisWeek === 1 ? "" : "s"} terminée
            {totalThisWeek === 1 ? "" : "s"} cette semaine
          </SummaryBanner>

          <CollapsibleSection icon={<CalendarDays size={20} />} title="Aujourd'hui" count={today.length}>
            <TaskSection tasks={today} emptyLabel="Rien de terminé aujourd'hui." />
          </CollapsibleSection>

          <CollapsibleSection
            icon={<CalendarDays size={20} />}
            title="Cette semaine"
            count={thisWeek.length}
          >
            <TaskSection tasks={thisWeek} emptyLabel="Rien de terminé cette semaine." />
          </CollapsibleSection>

          <CollapsibleSection icon={<Clock size={20} />} title="Plus anciennes" count={older.length}>
            <TaskSection tasks={older} emptyLabel="Aucune tâche terminée plus ancienne." />
          </CollapsibleSection>
        </>
      )}

      <Button
        variant="secondary"
        fullWidth
        icon={<Bell size={18} />}
        onClick={() => setNotificationsOpen(true)}
      >
        Paramètre des notifications
      </Button>
      <NotificationSettingsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </section>
  );
}
