import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// base: für GitHub Pages unter https://<user>.github.io/freshpost/.
// Lokal (dev/preview) bleibt es "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/freshpost/" : "/",
  plugins: [
    react(),
    // PWA: installierbar + offline (Assets inkl. Fonts/Paper vorgecacht).
    // Icons sind CI-Platzhalter (45°-Dreiecke) — bei echtem Logo ersetzen.
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "freshpost — Sharepics im fresh-Design",
        short_name: "freshpost",
        description: "Sharepics, Posts und Stories im fresh-CI erstellen.",
        lang: "de",
        display: "standalone",
        background_color: "#0a1114",
        theme_color: "#0a1114",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,woff2}"],
      },
    }),
  ],
}));
