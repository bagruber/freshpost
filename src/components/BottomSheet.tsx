import { useEffect, useRef, useState, type ReactNode } from "react";

// Mobile: Controls als Bottom-Sheet, das größtenteils verborgen ist und per
// Griff hoch-/runtergezogen (oder getippt) wird. Auf Desktop (kein Sheet)
// rendert es die Controls einfach als Seitenspalte — die CSS-Klasse steuert das.

const MOBILE_QUERY = "(max-width: 760px)";
const PEEK = 76; // sichtbarer Streifen im geschlossenen Zustand (px)
const SHEET_VH = 0.72; // Sheet-Höhe relativ zur Viewport-Höhe

export function BottomSheet({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const startY = useRef(0);

  useEffect(() => {
    const m = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  const onMove = (e: PointerEvent) => setDrag(e.clientY - startY.current);
  const onUp = (e: PointerEvent) => {
    const d = e.clientY - startY.current;
    if (Math.abs(d) < 6) setOpen((o) => !o);
    else if (d < -40) setOpen(true);
    else if (d > 40) setOpen(false);
    setDrag(null);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };
  const onDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  let style: React.CSSProperties = {};
  if (isMobile) {
    const closed = Math.max(0, window.innerHeight * SHEET_VH - PEEK);
    let ty = open ? 0 : closed;
    if (drag != null) ty = Math.min(closed, Math.max(0, (open ? 0 : closed) + drag));
    style = { transform: `translateY(${ty}px)`, transition: drag != null ? "none" : undefined };
  }

  return (
    <div className={`controls-shell${isMobile ? " as-sheet" : ""}`} style={style}>
      <div className="sheet-handle" onPointerDown={onDown}>
        <span />
      </div>
      <div className="controls-scroll">{children}</div>
    </div>
  );
}
