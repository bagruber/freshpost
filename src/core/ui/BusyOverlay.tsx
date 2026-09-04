// Blockierendes Overlay fuer nicht abbrechbare Schritte (Freistellen).

export function BusyOverlay({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="busy-overlay" role="alert" aria-busy="true">
      <span className="spinner" />
      <p className="busy-title">{title}</p>
      <p className="busy-hint">{hint}</p>
    </div>
  );
}

// Der einzige lange Vorgang im Werkzeug — Text an einer Stelle, damit die
// beiden Aufrufer nicht auseinanderlaufen.
export const CUTOUT_BUSY = {
  title: "Hintergrund wird entfernt …",
  hint: "dauert meist 10–30 Sekunden — beim ersten Mal länger, weil das Modell einmalig geladen wird (~50 MB)",
};
