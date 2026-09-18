import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
// Real Marianne files (real font-face rules, no base64) instead of
// Cunningham's own "cunningham-react/fonts" (Roboto Flex Variable,
// ~590KB embedded as base64 in its CSS) — see cunningham-overrides.css.
import "@gouvfr-lasuite/ui-kit/fonts/Marianne";
import "@gouvfr-lasuite/cunningham-react/icons";
import "@gouvfr-lasuite/ui-kit/style";
// Must load after ui-kit/style so these token overrides win the cascade —
// see docs/DECISIONS.md, "Theme Cunningham's border-radius tokens globally".
import "./theme/cunningham-overrides.css";
import { AppProviders } from "./app/providers/AppProviders";
import { router } from "./app/router/routes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
