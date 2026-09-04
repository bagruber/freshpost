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
import "./styles/compose.css";
import "./core/styles/frame.css";
import { Root } from "./Root";
import { BrandProvider, applyBrandTokens } from "./brand/context";
import { fresh } from "./brands/fresh";
import { sz } from "./brands/sz";
import "@fontsource/fira-sans/400.css";
import "@fontsource/fira-sans/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/400-italic.css";
import "@fontsource/source-serif-4/600-italic.css";

// Service Worker für Offline-Betrieb; neue Versionen aktivieren sich selbst.
registerSW({ immediate: true });

// Die aktive Marke wird hier gewaehlt — der einzige Ort, an dem die App
// weiss, welche es ist. Alles darunter liest sie aus dem Context.
//
// Vorerst per ?brand=… umschaltbar. Spaeter waehlt der Build die Marke
// (VITE_BRAND) und jede bekommt ihre eigene Adresse; die Stelle bleibt diese.
const BRANDS = { fresh, sz };
const wanted = new URLSearchParams(location.search).get("brand");
const brand = (wanted && wanted in BRANDS ? BRANDS[wanted as keyof typeof BRANDS] : fresh);

// Tokens einmal synchron setzen, bevor React rendert.
applyBrandTokens(brand);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrandProvider brand={brand}>
      <Root />
    </BrandProvider>
  </StrictMode>,
);
