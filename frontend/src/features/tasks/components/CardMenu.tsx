import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import "./CardMenu.css";

// Self-built, no external popover dependency — @gouvfr-lasuite/ui-kit's
// DropdownMenu never actually opened anything in the DOM on click (confirmed
// via a live browser test: no new element appears anywhere, no console
// error), on both usages that tried it. Simple enough not to be worth
// depending on a seemingly broken third-party component for.
export type CardMenuItem = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
};

export function CardMenu({ items, ariaLabel }: { items: CardMenuItem[]; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="card-menu" ref={containerRef}>
      <button
        type="button"
        className="card-menu__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="card-menu__panel" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={"card-menu__item" + (item.danger ? " card-menu__item--danger" : "")}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
