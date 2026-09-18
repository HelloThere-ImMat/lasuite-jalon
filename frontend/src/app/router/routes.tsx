import { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { LazyDemoPage } from "./LazyDemoPage";
import { InboxPage } from "../../features/tasks/pages/InboxPage";
import { TodayPage } from "../../features/tasks/pages/TodayPage";
import { UpcomingPage } from "../../features/tasks/pages/UpcomingPage";
import { CompletedPage } from "../../features/tasks/pages/CompletedPage";
import { DetectedPage } from "../../features/tasks/pages/DetectedPage";

// "/" is the Inbox (brief §11: "/ or /inbox"); "/detected" is a deep link
// only, not a bottom-nav tab — see docs/UX_UI.md. "/demo" (Milestone 6 mock
// integrations) is deliberately outside AppShell — no header/bottom-nav
// chrome, not linked from the main nav, direct-URL only — see
// docs/DECISIONS.md, "Milestone 6 mock access".
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <InboxPage /> },
      { path: "/today", element: <TodayPage /> },
      { path: "/upcoming", element: <UpcomingPage /> },
      { path: "/completed", element: <CompletedPage /> },
      { path: "/detected", element: <DetectedPage /> },
    ],
  },
  {
    path: "/demo",
    element: (
      <Suspense fallback={<p>Chargement...</p>}>
        <LazyDemoPage />
      </Suspense>
    ),
  },
]);
