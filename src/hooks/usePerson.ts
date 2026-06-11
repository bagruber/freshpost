import { useCallback, useMemo, useState } from "react";
import { extents, clampToCanvas, type Size, type Pos } from "../lib/geometry";
import type { Dimension } from "../lib/dimensions";
import { loadPersonFile, needsCutout, recolorPersonToCI, type PersonError } from "../lib/personImage";
import { removePersonBackground } from "../lib/removeBg";
import type { PersonLook, FrameColor } from "../lib/types";
import { DEFAULTS } from "../lib/config";

// Kompletter Person-Modus-Zustand: freigestelltes PNG/WebP, Look, Rahmen-
// Settings, CI-Recolor (async nachgeladen), Drag/Clamp und Measure-Dedupe.

// S/W + River-Tint als CSS-Farbfilter (Person-Look). Exportiert für die
// Look-Vorschau-Kacheln in PersonControls.
export const BWRIVER_FILTER = "grayscale(1) brightness(1.05) sepia(1) hue-rotate(155deg) saturate(2.2)";
const FRAME_HEX: Record<FrameColor, string> = { white: "#ffffff", river: "#466e7f" };

// opaque = Bild hat keine Transparenz (sieht nicht freigestellt aus) →
// Controls bieten „Hintergrund entfernen" an.
export type Person = {
  pngUrl: string;
  ciUrl: string | null;
  opaque: boolean;
  x: number;
  y: number;
  scale: number;
};

export function usePerson(dimension: Dimension) {
  const [item, setItem] = useState<Person | null>(null);
  const [look, setLook] = useState<PersonLook>("original");
  const [frameColor, setFrameColor] = useState<FrameColor>("white");
  const [frameThickness, setFrameThickness] = useState(DEFAULTS.frameThickness);
  const [frameRough, setFrameRough] = useState(DEFAULTS.frameRough);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false); // Freistellen läuft (UI blockiert)

  // CI-Variante asynchron nachziehen (Alpha bleibt erhalten).
  const startRecolor = (pngUrl: string) => {
    recolorPersonToCI(pngUrl)
      .then((ciUrl) => setItem((p) => (p && p.pngUrl === pngUrl ? { ...p, ciUrl } : p)))
      .catch(() => {});
  };

  // Wirft PersonError-Keys (siehe PERSON_ERROR_TEXT) — Mapping macht der
  // Aufrufer. Das Bild wird immer direkt übernommen; Freistellen ist ein
  // separater Schritt (removeBg), den die Controls bei opaken Bildern anbieten.
  const load = async (file: File) => {
    const pngUrl = await loadPersonFile(file); // validiert Typ/Größe
    const opaque = await needsCutout(file);
    setItem({ pngUrl, ciUrl: null, opaque, x: 0.5, y: 0.5, scale: DEFAULTS.personScale });
    startRecolor(pngUrl);
  };

  // Hintergrund des aktuellen Bilds entfernen. Wirft "removal" bei Fehler.
  const removeBg = async () => {
    const current = item;
    if (!current || busy) return;
    setBusy(true);
    let pngUrl: string;
    try {
      pngUrl = await removePersonBackground(current.pngUrl);
    } catch {
      throw "removal" satisfies PersonError;
    } finally {
      setBusy(false);
    }
    setItem((p) => (p && p.pngUrl === current.pngUrl ? { ...p, pngUrl, ciUrl: null, opaque: false } : p));
    startRecolor(pngUrl);
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
    busy,
    displaySrc,
    look,
    lookFilter: look === "bwriver" ? BWRIVER_FILTER : "",
    frameColor,
    frameHex: FRAME_HEX[frameColor],
    frameThickness,
    frameRough,
    load,
    removeBg,
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
