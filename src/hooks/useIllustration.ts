import { useCallback, useMemo, useState } from "react";
import { extents, clampToCanvas, type Size, type Pos } from "../lib/geometry";
import type { Dimension } from "../lib/dimensions";
import { loadIllustration, illuSrc, type Illu } from "../lib/illustration";
import { DEFAULTS } from "../lib/config";

// Kompletter Illustrations-Modus-Zustand: SVG/PNG, umschaltbares CI-Recolor,
// Drag/Clamp und Measure-Dedupe.

export function useIllustration(dimension: Dimension) {
  const [item, setItem] = useState<Illu | null>(null);
  const [recolor, setRecolor] = useState(true);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });

  // Wirft IlluError-Keys (siehe ILLU_ERROR_TEXT) — Mapping macht der Aufrufer.
  const load = async (file: File) => {
    const loaded = await loadIllustration(file);
    setItem({ ...loaded, x: 0.5, y: 0.5, scale: DEFAULTS.illuScale });
  };

  const displaySrc = useMemo(() => (item ? illuSrc(item, recolor) : null), [item, recolor]);

  const ext = useMemo(() => extents(size, 0, dimension), [size, dimension]);
  const onDrag = (raw: Pos) => {
    const p = clampToCanvas(raw, ext);
    setItem((i) => (i ? { ...i, x: p.x, y: p.y } : i));
  };

  // Dedupe wie beim Claim — sonst Endlosschleife (setState im Layout-Effekt).
  const onMeasure = useCallback((s: Size) => {
    setSize((p) => (p.w === s.w && p.h === s.h ? p : s));
  }, []);

  return {
    item,
    displaySrc,
    recolor,
    load,
    clear: () => setItem(null),
    setScale: (v: number) => setItem((i) => (i ? { ...i, scale: v } : i)),
    setRecolor,
    onDrag,
    onMeasure,
  };
}

export type IllustrationState = ReturnType<typeof useIllustration>;
