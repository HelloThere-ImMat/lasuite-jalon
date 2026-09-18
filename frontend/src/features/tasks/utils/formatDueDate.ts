import {
  addWeeks,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isToday,
  isTomorrow,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

// Direction-agnostic "same Monday–Sunday calendar week as today" check —
// shared by isDueThisWeek (future due dates, À venir) and
// getCompletedBadge/isCompletedThisWeek (past completion times, Terminées),
// which need the same week boundary in opposite directions (forward vs.
// backward from today) — see docs/audits/upcoming-page-redesign.md,
// Ambiguity #1 for why a real calendar week, not a rolling window.
function isSameCalendarWeek(date: Date, reference = new Date()): boolean {
  return (
    !isBefore(date, startOfWeek(reference, { weekStartsOn: 1 })) &&
    !isAfter(date, endOfWeek(reference, { weekStartsOn: 1 }))
  );
}

// A date-only reminder (no specific time — docs/API_CONTRACT.md, "Date
// format") is stored as exact UTC midnight, which is a calendar day, not a
// real instant. Reading that back with the viewer's *local* timezone (what
// `new Date(iso)` + date-fns normally do) shifts it to the previous day for
// anyone behind UTC — verified live (docs/audits/full-app-review-2026-09-16.md):
// the same task read "Vendredi" in Paris but "Demain" in Cayenne/New York.
// Every other reminder in this app always carries a real time-of-day (the AI
// prompt is told "if only a day is given, use 09:00", never midnight; the
// demo mocks use the current time-of-day) — so "exact UTC midnight" is a
// safe, unambiguous signal that this is a date-only reminder, and re-reading
// its UTC calendar-date components as a *local* date (instead of converting
// the UTC instant through the viewer's timezone) makes it read as the same
// day everywhere. A genuinely time-specific reminder that happened to land
// on exact UTC midnight would be misread by this heuristic — none do today,
// but see docs/DECISIONS_A_TRANCHER.md for the fuller fix this doesn't
// attempt (a real date-only column, no UTC round-trip at all).
// Exported so taskFilters.ts's today/later-today grouping can use the same
// signal without duplicating it.
export function hasSpecificTime(iso: string): boolean {
  const date = new Date(iso);
  return !(
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

export function toLocalCalendarDate(iso: string): Date {
  const date = new Date(iso);
  return hasSpecificTime(iso)
    ? date
    : new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isOverdue(iso: string): boolean {
  return isBefore(toLocalCalendarDate(iso), startOfDay(new Date()));
}

export function isDueToday(iso: string): boolean {
  return isToday(toLocalCalendarDate(iso));
}

// Red pill: due today or overdue — extends the mockup's "today = urgent"
// convention to overdue tasks too (docs/DECISIONS.md, "Milestone 3 scope").
export function isUrgent(iso: string): boolean {
  return isDueToday(iso) || isOverdue(iso);
}

export function isDueTomorrow(iso: string): boolean {
  return isTomorrow(toLocalCalendarDate(iso));
}

// Real Monday–Sunday calendar week (French convention) — deliberately not
// the rolling 7-day window formatDueDate()'s weekday-name bucket already
// uses below, since "cette semaine"/"semaine prochaine" (the "À venir" page,
// docs/audits/upcoming-page-redesign.md, Ambiguity #1) only read correctly
// as real calendar weeks: a rolling window has no fixed "next week" to
// point to.
export function isDueThisWeek(iso: string): boolean {
  const date = toLocalCalendarDate(iso);
  return !isDueTomorrow(iso) && !isBefore(date, startOfDay(new Date())) && isSameCalendarWeek(date);
}

export function isDueNextWeek(iso: string): boolean {
  const date = toLocalCalendarDate(iso);
  const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });
  return !isBefore(date, nextWeekStart) && !isAfter(date, nextWeekEnd);
}

// Matches docs/assets/mockup-inbox-v2.png's convention: "Aujourd'hui"/"En
// retard", "Demain", a weekday name for the rest of the coming week, then a
// plain short date beyond that.
export function formatDueDate(iso: string): string {
  const date = toLocalCalendarDate(iso);
  if (isOverdue(iso)) return "En retard";
  if (isDueToday(iso)) return "Aujourd'hui";
  if (isTomorrow(date)) return "Demain";
  if (differenceInCalendarDays(date, new Date()) <= 7) {
    const weekday = format(date, "EEEE", { locale: fr });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
  return format(date, "d MMM", { locale: fr });
}

// A task due today with a real time-of-day shows that time instead of the
// vague "Aujourd'hui" label — found in a new reference mockup for
// "Aujourd'hui" (2026-09-16). Extended for "À venir" (2026-09-16,
// docs/audits/upcoming-page-redesign.md): tomorrow *keeps* its "Demain"
// label and appends the time ("Demain · 09:00" — unlike today, which drops
// the label entirely) and next calendar week gets its own "Semaine
// prochaine" label. Every other day still falls through to formatDueDate()
// unchanged — no reference exists for anything further out.
export function getDueBadge(iso: string): {
  label: string;
  icon: "calendar" | "clock";
  urgent: boolean;
} {
  if (isDueToday(iso) && hasSpecificTime(iso)) {
    return { label: format(new Date(iso), "HH:mm"), icon: "clock", urgent: false };
  }
  if (isDueTomorrow(iso) && hasSpecificTime(iso)) {
    return {
      label: `Demain · ${format(new Date(iso), "HH:mm")}`,
      icon: "calendar",
      urgent: false,
    };
  }
  if (isDueNextWeek(iso)) {
    return { label: "Semaine prochaine", icon: "calendar", urgent: false };
  }
  return { label: formatDueDate(iso), icon: "calendar", urgent: isUrgent(iso) };
}

export function isCompletedToday(updatedAtIso: string): boolean {
  return isToday(new Date(updatedAtIso));
}

export function isCompletedThisWeek(updatedAtIso: string): boolean {
  return !isCompletedToday(updatedAtIso) && isSameCalendarWeek(new Date(updatedAtIso));
}

// "Terminées" (2026-09-16, new reference mockup): a green checkmark badge
// showing *when the task was completed* instead of the normal due-date
// badge. Keyed off `updatedAt` as a heuristic (docs/DECISIONS.md has "No
// completedAt for now" — no schema change here, see
// docs/DECISIONS_A_TRANCHER.md for the known imprecision this accepts:
// editing a completed task afterward also bumps `updatedAt`). Never needs
// the date-only/UTC-midnight handling `getDueBadge` does — `updatedAt` is
// always a real precise timestamp.
export function getCompletedBadge(updatedAtIso: string): { label: string; icon: "check" } {
  const date = new Date(updatedAtIso);
  if (isCompletedToday(updatedAtIso)) {
    return { label: `Terminée · ${format(date, "HH:mm")}`, icon: "check" };
  }
  if (isCompletedThisWeek(updatedAtIso)) {
    const weekday = format(date, "EEEE", { locale: fr });
    return { label: `Terminée · ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`, icon: "check" };
  }
  return { label: "Terminée", icon: "check" };
}
