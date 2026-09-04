import { useState } from "react";
import App from "./App";
import { ComposeApp } from "./compose/ComposeApp";
import { useBrand } from "./brand/context";

// Werkzeug-Umschalter. „Beitrag" ist der markengetriebene Weg: ein
// Dokumentmodell, Layouts und Rollen aus dem Marken-Paket. Das Langtext-
// Werkzeug ist darin aufgegangen.
//
// „Einzelpost" ist freshs letztes altes Werkzeug mit eigenem Modell. Es
// braucht Faehigkeiten, die nicht jede Marke hat (Sticker-Geometrie,
// Farbpalette, texturierter Grund) — bei einer Marke ohne sie erscheint es
// gar nicht erst. Es zieht nach, sobald es auf die Composition migriert ist.

type Tool = "compose" | "single";
const KEY = "freshpost.tool";

export function Root() {
  const brand = useBrand();
  const legacy = !!(brand.sticker && brand.colors && brand.ground);

  const [tool, setTool] = useState<Tool>(() => {
    const saved = localStorage.getItem(KEY);
    return legacy && saved === "single" ? "single" : "compose";
  });

  const choose = (t: Tool) => {
    setTool(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* privater Modus → egal */
    }
  };

  const tabs: { id: Tool; label: string }[] = [
    { id: "compose", label: "Beitrag" },
    ...(legacy ? ([{ id: "single", label: "Einzelpost" }] as const) : []),
  ];

  return (
    <div className="root">
      <nav className="tool-switch" aria-label="Werkzeug">
        <span className="tool-brand">{brand.label}</span>
        {tabs.map((t) => (
          <button key={t.id} type="button" className={tool === t.id ? "active" : ""} onClick={() => choose(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="root-body">{tool === "single" && legacy ? <App /> : <ComposeApp />}</div>
    </div>
  );
}
