import { useState, type FormEvent } from "react";
import { Button, Input, Modal, ModalSize } from "@gouvfr-lasuite/cunningham-react";
import { X } from "lucide-react";
import "./NotificationSettingsModal.css";

// Presentation-only mock: no backend, nothing persisted — the list resets
// every time the page reloads.
const INITIAL_RECIPIENTS = [
  "camille.martin@numerique.gouv.fr",
  "julien.bernard@numerique.gouv.fr",
  "sophie.dubois@numerique.gouv.fr",
];

export function NotificationSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [recipients, setRecipients] = useState(INITIAL_RECIPIENTS);
  const [draft, setDraft] = useState("");

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value || recipients.includes(value)) return;
    setRecipients((prev) => [...prev, value]);
    setDraft("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={ModalSize.MEDIUM}
      title="Paramètre des notifications"
      rightActions={<Button onClick={onClose}>Fermer</Button>}
    >
      <p className="notification-settings__intro">
        Ces personnes sont notifiées lorsqu'une tâche est terminée.
      </p>

      <ul className="notification-settings__list">
        {recipients.map((recipient) => (
          <li key={recipient} className="notification-settings__item">
            <span className="notification-settings__avatar" aria-hidden="true">
              {recipient.slice(0, 1).toUpperCase()}
            </span>
            <span className="notification-settings__email">{recipient}</span>
            <button
              type="button"
              className="notification-settings__remove"
              onClick={() => setRecipients((prev) => prev.filter((r) => r !== recipient))}
              aria-label={`Retirer ${recipient}`}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="notification-settings__form">
        <Input
          label="Ajouter une personne"
          variant="classic"
          type="email"
          placeholder="prenom.nom@numerique.gouv.fr"
          fullWidth
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={!draft.trim()}>
          Ajouter
        </Button>
      </form>
    </Modal>
  );
}
