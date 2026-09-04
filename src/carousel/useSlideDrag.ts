import { useRef } from "react";
import { usePointerDrag } from "../core/input/usePointerDrag";

// Drag zum Verschieben eines Bildes/einer Cutout-Gruppe innerhalb eines Slides.
// Rechnet Pointer-Bewegung über das umschließende .cx-slide (echte Bildschirm-
// pixel) in Slide-Bruchteile um — funktioniert also trotz Vorschau-Skalierung.
// Meldet den neuen Versatz (x, y), auf ±0.5 begrenzt.

const clamp = (v: number) => Math.min(0.5, Math.max(-0.5, v));

export function useSlideDrag(onSet: (x: number, y: number) => void) {
  const ref = useRef<{ bx: number; by: number; cx: number; cy: number; w: number; h: number } | null>(null);

  const startDrag = usePointerDrag({
    onMove: (e) => {
      const r = ref.current;
      if (!r) return;
      onSet(clamp(r.bx + (e.clientX - r.cx) / r.w), clamp(r.by + (e.clientY - r.cy) / r.h));
    },
  });

  return (e: React.PointerEvent, baseX: number, baseY: number) => {
    const slide = (e.currentTarget as HTMLElement).closest(".cx-slide") as HTMLElement | null;
    if (!slide) return;
    const rect = slide.getBoundingClientRect();
    ref.current = { bx: baseX, by: baseY, cx: e.clientX, cy: e.clientY, w: rect.width, h: rect.height };
    startDrag(e);
  };
}
