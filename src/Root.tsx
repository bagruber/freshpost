import { useState } from "react";
import App from "./App";
import { CarouselApp } from "./carousel/CarouselApp";

// Werkzeug-Umschalter: das bestehende Einzelpost-Tool und das neue
// Langtext-/Karussell-Tool nebeneinander. Auswahl überlebt Reload.

type Tool = "single" | "carousel";
const KEY = "freshpost.tool";

export function Root() {
  const [tool, setTool] = useState<Tool>(() => (localStorage.getItem(KEY) === "carousel" ? "carousel" : "single"));

  const choose = (t: Tool) => {
    setTool(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* privater Modus → egal */
    }
  };

  return (
    <div className="root">
      <nav className="tool-switch" aria-label="Werkzeug">
        <span className="tool-brand">freshpost</span>
        <button type="button" className={tool === "single" ? "active" : ""} onClick={() => choose("single")}>
          Einzelpost
        </button>
        <button type="button" className={tool === "carousel" ? "active" : ""} onClick={() => choose("carousel")}>
          Langtext
        </button>
      </nav>
      <div className="root-body">{tool === "single" ? <App /> : <CarouselApp />}</div>
    </div>
  );
}
