import type { Task } from "../types/task";
import {
  hasSpecificTime,
  isCompletedThisWeek,
  isCompletedToday,
  isDueThisWeek,
  isDueToday,
  isDueTomorrow,
  isOverdue,
} from "./formatDueDate";

// Shared across Inbox ("À traiter") and the Today/Upcoming/Completed pages —
// see docs/DECISIONS.md, "Milestone 3 scope" ("how to apply": don't duplicate
// filtering logic). Both "detected" (not yet reviewed) and "ignored" tasks
// are excluded from every active view — an ignored task stays in the DB but
// is never shown again outside "Détectées automatiquement" itself (which
// only lists "detected" ones) — see docs/DECISIONS.md, "Detection status".
function isActive(task: Task): boolean {
  return (
    task.status !== "completed" &&
    task.detectionStatus !== "detected" &&
    task.detectionStatus !== "ignored"
  );
}

// "À traiter" excludes future-dated tasks — those belong to the Inbox's own
// "À venir" section instead, so a task never appears twice on the same
// screen (docs/DECISIONS.md, "Inbox 'À traiter' + 'À venir' duplication").
export function isToTreat(task: Task): boolean {
  return isActive(task) && !isUpcomingTask(task);
}

export function isDetectedTask(task: Task): boolean {
  return task.detectionStatus === "detected";
}

// "Aujourd'hui" = due today or overdue, per docs/DECISIONS.md.
export function isTodayTask(task: Task): boolean {
  return isActive(task) && !!task.dueAt && (isDueToday(task.dueAt) || isOverdue(task.dueAt));
}

// "À venir" = has a due date strictly in the future (not today, not overdue).
export function isUpcomingTask(task: Task): boolean {
  return (
    isActive(task) && !!task.dueAt && !isDueToday(task.dueAt) && !isOverdue(task.dueAt)
  );
}

export function isCompletedTask(task: Task): boolean {
  return task.status === "completed";
}

// "Aujourd'hui" page groups (2026-09-16, new reference mockup): a task with
// no specific time (date-only) or whose time-of-day has already passed goes
// in "À faire maintenant"; a task with a real time still ahead today goes in
// "En cours de journée". Detected tasks are excluded from both by
// isTodayTask's isActive() check — they get their own "Détectées
// aujourd'hui" group below.
export function isDueLaterToday(task: Task): boolean {
  return (
    isTodayTask(task) &&
    !!task.dueAt &&
    hasSpecificTime(task.dueAt) &&
    new Date(task.dueAt).getTime() > Date.now()
  );
}

export function isDueNowOrPastToday(task: Task): boolean {
  return isTodayTask(task) && !isDueLaterToday(task);
}

// Detected tasks specifically due today — narrower than the Inbox's
// "Détectées automatiquement" (which shows every detected task regardless
// of date), matching this page's own "today" framing.
export function isDetectedToday(task: Task): boolean {
  return isDetectedTask(task) && !!task.dueAt && isDueToday(task.dueAt);
}

// "À venir" page groups (2026-09-16, new reference mockup,
// docs/audits/upcoming-page-redesign.md): a real Monday–Sunday calendar
// week, not the rolling 7-day window formatDueDate()'s weekday-name bucket
// uses — see isDueThisWeek's own comment for why.
export function isDueTomorrowTask(task: Task): boolean {
  return isUpcomingTask(task) && !!task.dueAt && isDueTomorrow(task.dueAt);
}

export function isDueThisWeekTask(task: Task): boolean {
  return isUpcomingTask(task) && !!task.dueAt && isDueThisWeek(task.dueAt);
}

export function isDueLaterTask(task: Task): boolean {
  return (
    isUpcomingTask(task) &&
    !!task.dueAt &&
    !isDueTomorrowTask(task) &&
    !isDueThisWeek(task.dueAt)
  );
}

// "Terminées" page groups (2026-09-16, new reference mockup) — keyed off
// updatedAt as a completion-time heuristic, see getCompletedBadge's own
// comment in formatDueDate.ts for why.
export function isCompletedTodayTask(task: Task): boolean {
  return isCompletedTask(task) && isCompletedToday(task.updatedAt);
}

export function isCompletedThisWeekTask(task: Task): boolean {
  return isCompletedTask(task) && isCompletedThisWeek(task.updatedAt);
}

export function isCompletedOlderTask(task: Task): boolean {
  return (
    isCompletedTask(task) && !isCompletedTodayTask(task) && !isCompletedThisWeekTask(task)
  );
}
