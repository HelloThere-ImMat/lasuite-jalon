import type { CapacitorConfig } from '@capacitor/cli';

// No `server.url` committed here on purpose: for a demo build, point the
// native shell at that day's `cloudflared` tunnel for the frontend (same
// ephemeral-URL pattern already used for PWA testing this session,
// docs/DECISIONS_A_TRANCHER.md "No-auth backend..." — "Scope clarified").
// Add `server: { url: "https://<today's-tunnel>.trycloudflare.com" }` as a
// local, uncommitted edit before building in Xcode. Unset (this committed
// state), Capacitor loads the bundled `dist/` output instead — the eventual
// production path once a real backend origin exists (see
// docs/audits/capacitor-ios-packaging.md, step 6).
const config: CapacitorConfig = {
  appId: 'fr.gouv.lasuite.tasks',
  appName: 'Jalon',
  webDir: 'dist'
};

export default config;
