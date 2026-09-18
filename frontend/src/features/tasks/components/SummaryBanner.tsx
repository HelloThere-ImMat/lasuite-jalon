import type { ReactNode } from "react";
import "./SummaryBanner.css";

// Static, non-interactive info banner — shared by TodayPage and
// UpcomingPage (2026-09-16 reference mockups both show one; no defined
// behavior for the chevron in either, so it doesn't collapse anything).
export function SummaryBanner({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="summary-banner">
      {icon}
      <span>{children}</span>
    </div>
  );
}
