import { Search, SlidersHorizontal } from "lucide-react";
import "./SearchBar.css";

// Non-functional placeholder — search/filtering is explicitly out of scope
// for now (docs/UX_UI.md: "treat as a later-milestone nice-to-have, not
// M1–M4 scope, and not something to invent behavior for yet"). Shown so the
// Inbox visually matches the reference (docs/assets/mockup-inbox-v2.png).
export function SearchBar() {
  return (
    <div className="search-bar">
      <div className="search-bar__field" aria-disabled="true">
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          placeholder="Rechercher une tâche, un contact..."
          disabled
          aria-label="Rechercher une tâche (pas encore disponible)"
        />
      </div>
      <button type="button" className="search-bar__filter" disabled aria-label="Filtres (pas encore disponible)">
        <SlidersHorizontal size={18} />
      </button>
    </div>
  );
}
