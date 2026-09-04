import { useState } from "react";
import App from "./App";
import { CarouselApp } from "./carousel/CarouselApp";
import { ComposeApp } from "./compose/ComposeApp";
import { useBrand } from "./brand/context";

// Werkzeug-Umschalter. „Beitrag" ist der markengetriebene Weg (ein
// Dokumentmodell, Layouts und Rollen aus dem Marken-Paket).
//
// „Einzelpost" und „Langtext" sind freshs alte Werkzeuge mit eigenem Modell.
// Sie brauchen Faehigkeiten, die nicht jede Marke hat (Sticker-Geometrie,
// Farbpalette, texturierter Grund) — bei einer Marke ohne sie erscheinen sie
// gar nicht erst. Genau dafuer ist das Faehigkeiten-Modell im Vertrag da.
// Sie ziehen nach, sobald sie auf die Composition migriert sind.

type Tool = "compose" | "single" | "carousel";
const KEY = "freshpost.tool";

export function Root() {
  const brand = useBrand();
  const legacy = !!(brand.sticker && brand.colors && brand.ground);

  const [tool, setTool] = useState<Tool>(() => {
    const saved = localStorage.getItem(KEY);
    if (legacy && (saved === "single" || saved === "carousel")) return saved;
    return "compose";
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
    ...(legacy
      ? ([
          { id: "single", label: "Einzelpost" },
          { id: "carousel", label: "Langtext" },
        ] as const)
      : []),
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
      <div className="root-body">
        {tool === "single" && legacy ? <App /> : tool === "carousel" && legacy ? <CarouselApp /> : <ComposeApp />}
      </div>
    </div>
  );
}
