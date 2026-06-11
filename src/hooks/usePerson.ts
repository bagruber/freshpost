import { useCallback, useMemo, useState } from "react";
import { extents, clampToCanvas, type Size, type Pos } from "../lib/geometry";
import type { Dimension } from "../lib/dimensions";
import { loadPersonFile, recolorPersonToCI } from "../lib/personImage";
import type { PersonLook, FrameColor } from "../lib/types";
import { DEFAULTS } from "../lib/config";

// Kompletter Person-Modus-Zustand: freigestelltes PNG/WebP, Look, Rahmen-
// Settings, CI-Recolor (async nachgeladen), Drag/Clamp und Measure-Dedupe.

// S/W + River-Tint als CSS-Farbfilter (Person-Look).
const BWRIVER_FILTER = "grayscale(1) brightness(1.05) sepia(1) hue-rotate(155deg) saturate(2.2)";
const FRAME_HEX: Record<FrameColor, string> = { white: "#ffffff", river: "#466e7f" };

export type Person = { pngUrl: string; ciUrl: string | null; x: number; y: number; scale: number };

export function usePerson(dimension: Dimension) {
  const [item, setItem] = useState<Person | null>(null);
  const [look, setLook] = useState<PersonLook>("original");
  const [frameColor, setFrameColor] = useState<FrameColor>("white");
  const [frameThickness, setFrameThickness] = useState(DEFAULTS.frameThickness);
  const [frameRough, setFrameRough] = useState(DEFAULTS.frameRough);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });

  // Wirft PersonError-Keys (siehe PERSON_ERROR_TEXT) — Mapping macht der Aufrufer.
  const load = async (file: File) => {
    const pngUrl = await loadPersonFile(file);
    setItem({ pngUrl, ciUrl: null, x: 0.5, y: 0.5, scale: DEFAULTS.personScale });
    recolorPersonToCI(pngUrl)
      .then((ciUrl) => setItem((p) => (p && p.pngUrl === pngUrl ? { ...p, ciUrl } : p)))
      .catch(() => {});
  };

  const displaySrc = item ? (look === "ci" ? item.ciUrl ?? item.pngUrl : item.pngUrl) : null;

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
    look,
    lookFilter: look === "bwriver" ? BWRIVER_FILTER : "",
    frameColor,
    frameHex: FRAME_HEX[frameColor],
    frameThickness,
    frameRough,
    load,
    clear: () => setItem(null),
    setScale: (v: number) => setItem((i) => (i ? { ...i, scale: v } : i)),
    setLook,
    setFrameColor,
    setFrameThickness,
    setFrameRough,
    onDrag,
    onMeasure,
  };
}

export type PersonState = ReturnType<typeof usePerson>;
