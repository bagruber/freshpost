import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePointerDrag } from "../hooks/usePointerDrag";

// Mobile: Controls als Bottom-Sheet, das größtenteils verborgen ist und per
// Griff hoch-/runtergezogen (oder getippt) wird. Auf Desktop (kein Sheet)
// rendert es die Controls einfach als Seitenspalte — die CSS-Klasse steuert das.
//
// Tipp-Modus: Beim Fokus eines Textfelds snappt das Sheet so, dass über der
// Tastatur nur ein kompakter Streifen bleibt und die Stage sichtbar wird
// (visualViewport liefert die Tastaturhöhe; auf Android zusätzlich
// interactive-widget=resizes-content im Viewport-Meta).

const MOBILE_QUERY = "(max-width: 760px)";
const PEEK = 128; // sichtbarer Streifen im geschlossenen Zustand (px): Griff + Header
const SHEET_VH = 0.72; // Sheet-Höhe relativ zur Viewport-Höhe
const EDIT_SHEET_FRACTION = 0.5; // Sheet-Anteil am sichtbaren Viewport beim Tippen

type Props = { warn: boolean; header: ReactNode; children: ReactNode };

export function BottomSheet({ warn, header, children }: Props) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [vvH, setVvH] = useState(() => window.visualViewport?.height ?? window.innerHeight);
  const startY = useRef(0);

  useEffect(() => {
    const m = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  // Sichtbare Viewport-Höhe verfolgen (ändert sich mit der Bildschirmtastatur).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setVvH(vv.height);
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const startDrag = usePointerDrag({
    onMove: (e) => setDrag(e.clientY - startY.current),
    onEnd: (e) => {
      const d = e.clientY - startY.current;
      if (Math.abs(d) < 6) setOpen((o) => !o);
      else if (d < -40) setOpen(true);
      else if (d > 40) setOpen(false);
      setDrag(null);
    },
  });
  const onDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    startDrag(e);
  };

  const onFocusIn = (e: React.FocusEvent) => {
    if (!(e.target instanceof HTMLTextAreaElement)) return;
    setEditing(true);
    // Nach dem Snap das fokussierte Feld in den sichtbaren Streifen scrollen.
    const el = e.target;
    setTimeout(() => el.scrollIntoView({ block: "nearest" }), 350);
  };
  const onFocusOut = (e: React.FocusEvent) => {
    if (e.relatedTarget instanceof HTMLTextAreaElement) return; // Feldwechsel
    setEditing(false);
  };

  let style: React.CSSProperties = {};
  if (isMobile) {
    const sheetH = window.innerHeight * SHEET_VH;
    const closed = Math.max(0, sheetH - PEEK);
    const kb = Math.max(0, window.innerHeight - vvH); // Tastaturhöhe (iOS-Overlay)
    let ty = open ? 0 : closed;
    if (editing && drag == null) {
      const visible = Math.min(sheetH - kb, vvH * EDIT_SHEET_FRACTION);
      ty = Math.min(closed, Math.max(0, sheetH - kb - visible));
    }
    if (drag != null) ty = Math.min(closed, Math.max(0, (open ? 0 : closed) + drag));
    style = { transform: `translateY(${ty}px)`, transition: drag != null ? "none" : undefined };
  }

  return (
    <div
      className={`controls-shell${isMobile ? " as-sheet" : ""}`}
      style={style}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    >
      {warn && (
        <div className="zone-warning" role="alert">
          <span className="zone-warning-icon">⚠</span>
          Claim außerhalb der Safety-Zone
        </div>
      )}
      <div className="sheet-handle" onPointerDown={onDown}>
        <span />
      </div>
      <div className="sheet-header">
        <span className="sheet-hint">Hier bearbeiten</span>
        {header}
      </div>
      <div className="controls-scroll">{children}</div>
    </div>
  );
}
