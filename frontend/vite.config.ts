import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Manifest + service worker, Milestone 5 (docs/ARCHITECTURE.md, "PWA").
    // Conservative strategy on purpose: precaches only the built app shell
    // (JS/CSS/HTML/icons) so the UI loads instantly and installs offline —
    // no runtimeCaching for /api/*, so task data always hits the network
    // and fails normally offline (existing isError states already handle
    // that). No offline mutation queueing — explicitly out of scope.
    VitePWA({
      // WKWebView (Capacitor's iOS runtime) doesn't support service workers
      // at all, and a Capacitor build already ships every asset bundled —
      // no SW needed there, and shipping one anyway is dead code at best,
      // stale-cache confusion at worst. `bun run build:ios` sets CAPACITOR=true
      // (frontend/package.json); plain `bun run build` (web/PWA) is unaffected.
      // See docs/audits/capacitor-ios-packaging.md, step 5.
      disable: process.env.CAPACITOR === 'true',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon-512.png'],
      manifest: {
        name: 'Jalon — La Suite numérique',
        short_name: 'Jalon',
        description: 'Vos tâches, un esprit plus libre.',
        lang: 'fr',
        theme_color: '#000091',
        background_color: '#F7F9FC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.png', sizes: '192x192', type: 'image/png' },
          { src: 'favicon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // @gouvfr-lasuite/ui-kit only exposes one barrel import (no
        // deep-import path for just CunninghamProvider — checked its
        // package.json's `exports`), pulling unrelated internals into
        // whatever chunk imports it. Splitting it into its own vendor
        // chunk doesn't shrink the total bytes, but it rarely changes
        // between deploys, so the PWA's service worker (generateSW) only
        // re-downloads it once instead of on every app-code update —
        // found during a suggestions audit.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@gouvfr-lasuite")) return "vendor-ui-kit";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) {
            return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    // Vite rejects requests whose Host header it doesn't recognize by
    // default (anti DNS-rebinding). A `cloudflared` quick tunnel (real
    // device / demo testing, docs/DECISIONS_A_TRANCHER.md "No-auth
    // backend..." -> "Scope clarified", docs/handoff/) presents a
    // `*.trycloudflare.com` host — allow that suffix specifically rather
    // than disabling the check entirely.
    allowedHosts: ['.trycloudflare.com'],
    // Forward HTTP API calls to the backend so the browser never deals with
    // CORS (the deployed server only allows http://localhost:3000). The
    // target includes the backend's base path; /api is stripped and appended
    // to it. Point API_PROXY_TARGET at http://localhost:3001/api for a local
    // backend. WebSockets don't go through here — see wsUrl in api/client.ts.
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'https://nudge.ovh/api/lasuite-jalon',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
