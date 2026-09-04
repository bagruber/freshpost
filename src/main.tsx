import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/900.css";
import "@fontsource/raleway/400.css";
import "@fontsource/raleway/500.css";
import "@fontsource/raleway/600.css";
import "@fontsource/raleway/700.css";
import "./core/styles/base.css";
import "./styles/app.css";
import "./styles/carousel.css";
import { Root } from "./Root";
import { BrandProvider, applyBrandTokens } from "./brand/context";
import { fresh } from "./brands/fresh";

// Service Worker für Offline-Betrieb; neue Versionen aktivieren sich selbst.
registerSW({ immediate: true });

// Die aktive Marke wird hier gewaehlt — der einzige Ort, an dem die App
// weiss, welche es ist. Alles darunter liest sie aus dem Context.
// Tokens einmal synchron setzen, bevor React rendert.
applyBrandTokens(fresh);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrandProvider brand={fresh}>
      <Root />
    </BrandProvider>
  </StrictMode>,
);
