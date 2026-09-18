import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ModalProvider, ToastProvider } from "@gouvfr-lasuite/cunningham-react";
import { CunninghamProvider } from "@gouvfr-lasuite/ui-kit";
import { queryClient } from "../../lib/queryClient";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    // Found while live-testing the delete confirmation dialog: its title/
    // message are ours (French, passed as props), but Cunningham's own
    // built-in strings (its Cancel/Delete/Confirm button labels, aria
    // labels, etc.) default to "en-US" without this — a real, previously
    // unnoticed bug, everything else in the app being custom-authored copy.
    <CunninghamProvider currentLocale="fr-FR">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ModalProvider>{children}</ModalProvider>
        </ToastProvider>
      </QueryClientProvider>
    </CunninghamProvider>
  );
}
