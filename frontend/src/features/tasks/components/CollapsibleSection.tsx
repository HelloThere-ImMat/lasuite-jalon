import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import "./CollapsibleSection.css";

export function CollapsibleSection({
  icon,
  title,
  count,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="collapsible-section">
      <button
        type="button"
        className="collapsible-section__header"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="collapsible-section__icon" aria-hidden="true">
          {icon}
        </span>
        <h2 className="collapsible-section__title">{title}</h2>
        <span className="collapsible-section__count">{count}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={
            "collapsible-section__chevron" +
            (open ? "" : " collapsible-section__chevron--closed")
          }
        />
      </button>
      {open && <div className="collapsible-section__body">{children}</div>}
    </section>
  );
}
