import { useCallback, useMemo, useState } from "react";
import { extents, clampToCanvas, type Size, type Pos } from "../core/canvas/geometry";
import type { Dimension } from "../core/canvas/dimension";
import { loadPersonFile, needsCutout, recolorPersonToCI, type PersonError } from "../core/media/personImage";
import { removePersonBackground } from "../core/media/removeBg";
import type { PersonLook } from "../core/doc/claim";
import { DEFAULTS } from "../core/config";
import { scaleGrade } from "../core/color/grade";
import { useBrand } from "../brand/context";

// Kompletter Person-Modus-Zustand: freigestelltes PNG/WebP, Look, Rahmen-
// Settings, CI-Recolor (async nachgeladen), Drag/Clamp und Measure-Dedupe.

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
  const brand = useBrand();
  const frames = brand.image.frameColors;
  const [item, setItem] = useState<Person | null>(null);
  const [look, setLook] = useState<PersonLook>("original");
  const [frameColor, setFrameColor] = useState<string>(frames[0].key);
  const [frameThickness, setFrameThickness] = useState(DEFAULTS.frameThickness);
  const [frameRough, setFrameRough] = useState(DEFAULTS.frameRough);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false); // Freistellen läuft (UI blockiert)

  // CI-Variante asynchron nachziehen (Alpha bleibt erhalten).
  const personGrade = scaleGrade(brand.image.grade, brand.image.personGradeFactor);

  const startRecolor = (pngUrl: string) => {
    recolorPersonToCI(pngUrl, personGrade)
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
    lookFilter: look === "bwriver" ? brand.image.personLookFilter : "",
    frameColor,
    frameHex: (frames.find((f) => f.key === frameColor) ?? frames[0]).hex,
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
