import { lazy } from "react";

// Dev/demo-only tooling (docs/DECISIONS.md, "Milestone 6 mock access") —
// real users never need it, so it's lazy-loaded instead of bundled into the
// main chunk everyone downloads (found during a suggestions audit). Its own
// file so this stays a pure component export (react-refresh/oxlint rule).
export const LazyDemoPage = lazy(() =>
  import("../../mocks/DemoPage").then((m) => ({ default: m.DemoPage })),
);
