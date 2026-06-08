import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: für GitHub Pages unter https://<user>.github.io/freshpost/.
// Lokal (dev/preview) bleibt es "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/freshpost/" : "/",
  plugins: [react()],
}));
