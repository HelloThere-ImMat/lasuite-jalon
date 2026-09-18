import "./PageHeader.css";

// Per-page title/subtitle, used inside each page's own content (not the
// shared AppShell chrome) — see docs/audits/ plan notes: the wordmark moved
// into AppShell itself, each page keeps its own heading like before, just
// with a subtitle now too.
export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-header">
      <h1 className="page-header__title">{title}</h1>
      <p className="page-header__subtitle">{subtitle}</p>
    </div>
  );
}
