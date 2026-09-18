import { NavLink, Outlet } from "react-router-dom";
import { CalendarDays, CheckCircle2, Inbox, ListTodo } from "lucide-react";
import { useTaskEvents } from "../../features/tasks/hooks/useTaskEvents";
import { useTaskLive } from "../../features/tasks/hooks/useTaskLive";
import "./AppShell.css";

// ui-kit's <Icon name="..."/> turned out not to be a general Material Icons
// renderer (it rendered the raw name as literal text — confirmed visually,
// see docs/DECISIONS.md) — switched to Lucide everywhere, already the
// working icon solution used elsewhere (CreateTaskBar, SearchBar, ...).
const NAV_ITEMS = [
  { to: "/", label: "Inbox", Icon: Inbox, end: true },
  { to: "/today", label: "Aujourd'hui", Icon: CalendarDays, end: false },
  { to: "/upcoming", label: "À venir", Icon: ListTodo, end: false },
  { to: "/completed", label: "Terminées", Icon: CheckCircle2, end: false },
] as const;

export function AppShell() {
  useTaskLive();
  useTaskEvents();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        {/* App favicon + wordmark (no Marianne emblem) — docs/UX_UI.md explicitly rules out a
            fabricated Marianne/government emblem ("no official brand asset
            available... fabricating a government emblem isn't appropriate").
            Per-page title/subtitle now lives in each page's own
            PageHeader, inside the scrollable content. */}
        <span className="app-shell__brand">
          <img src="/favicon.png" alt="" className="app-shell__logo" />
          <span className="app-shell__wordmark">Jalon</span>
        </span>
        {/* Placeholder avatar — no auth yet, nothing to show/click behind it.
            See docs/UX_UI.md ("no auth for now": placeholder for later). */}
        <span className="app-shell__avatar" aria-hidden="true">
          FD
        </span>
      </header>

      <main className="app-shell__main">
        <Outlet />
      </main>

      <nav className="app-shell__nav" aria-label="Navigation principale">
        {/* Header is hidden on desktop — repeat the brand atop the sidebar. */}
        <span className="app-shell__brand app-shell__brand--sidebar">
          <img src="/favicon.png" alt="" className="app-shell__logo" />
          <span className="app-shell__wordmark">Jalon</span>
        </span>
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="app-shell__nav-link">
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
