import { MailMockPanel } from "./MailMockPanel";
import { TchapMockPanel } from "./TchapMockPanel";
import { VisioMockPanel } from "./VisioMockPanel";
import "./DemoPage.css";

// Standalone demo/dev tooling — deliberately outside AppShell (no header/
// bottom-nav chrome) and not linked from the main nav, reached only by
// direct URL. Simulates the "mock the edges, real backend request, real
// stored task, real Tasks frontend" flow per docs/PRODUCT.md.
export function DemoPage() {
  return (
    <div className="demo-page">
      <h1>Démo — intégrations mockées</h1>
      <p className="demo-page__hint">
        Ces panneaux simulent Tchap/Mail/Visio. Chaque action déclenche un vrai appel à l'API —
        les tâches créées apparaissent dans la vraie app (<a href="/">Inbox</a>).
      </p>
      <TchapMockPanel />
      <MailMockPanel />
      <VisioMockPanel />
    </div>
  );
}
