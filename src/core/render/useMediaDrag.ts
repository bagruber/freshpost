import { useRef } from "react";
import { usePointerDrag } from "../input/usePointerDrag";

// Drag zum Verschieben der Bildgruppe innerhalb eines Frames. Rechnet die
// Pointer-Bewegung ueber den umschliessenden .fp-frame (echte Bildschirmpixel)
// in Bruchteile des Formats um — funktioniert also trotz Vorschau-Skalierung.
// Meldet den neuen Versatz (x, y), auf ±0.5 begrenzt.

const clamp = (v: number) => Math.min(0.5, Math.max(-0.5, v));

export function useMediaDrag(onSet: (x: number, y: number) => void) {
  const ref = useRef<{ bx: number; by: number; cx: number; cy: number; w: number; h: number } | null>(null);

  const startDrag = usePointerDrag({
    onMove: (e) => {
      const r = ref.current;
      if (!r) return;
      onSet(clamp(r.bx + (e.clientX - r.cx) / r.w), clamp(r.by + (e.clientY - r.cy) / r.h));
    },
  });

  return (e: React.PointerEvent, baseX: number, baseY: number) => {
    const frame = (e.currentTarget as HTMLElement).closest(".fp-frame") as HTMLElement | null;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    ref.current = { bx: baseX, by: baseY, cx: e.clientX, cy: e.clientY, w: rect.width, h: rect.height };
    startDrag(e);
  };
}
