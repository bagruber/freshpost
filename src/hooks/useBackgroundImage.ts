import { useEffect, useRef, useState } from "react";
import { filterToDataUrl, type Grade } from "../lib/ciFilter";
import type { LoadedImage } from "../lib/image";

// Hintergrund-Pipeline: Originale als ImageData in Refs, angezeigt wird die
// gefilterte Vorschau (kleine Auflösung) als Data-URL. Für den Export wird
// kurzzeitig das voll aufgelöste, gefilterte Bild in dasselbe <img> gesetzt.

type Pos = { x: number; y: number };

export function useBackgroundImage(grade: Grade) {
  const origFull = useRef<ImageData | null>(null);
  const origPreview = useRef<ImageData | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [bgPos, setBgPos] = useState<Pos>({ x: 50, y: 50 });
  const [version, setVersion] = useState(0);

  // Live-Vorschau (klein), per rAF gedrosselt.
  useEffect(() => {
    const prev = origPreview.current;
    if (!prev) return;
    const raf = requestAnimationFrame(() => setBgSrc(filterToDataUrl(prev, grade)));
    return () => cancelAnimationFrame(raf);
  }, [grade, version]);

  const setImage = (img: LoadedImage | null) => {
    if (!img) {
      origFull.current = null;
      origPreview.current = null;
      setBgSrc(null);
      return;
    }
    origFull.current = img.full;
    origPreview.current = img.preview;
    setBgPos({ x: 50, y: 50 });
    setVersion((v) => v + 1);
  };

  // Setzt für den Export das voll aufgelöste, gefilterte Bild ein und liefert
  // eine Funktion zum Zurücksetzen auf die Vorschau.
  const swapFullForExport = async (): Promise<() => void> => {
    const img = imgRef.current;
    const full = origFull.current;
    if (!img || !full) return () => {};
    const restore = img.src;
    img.src = filterToDataUrl(full, grade);
    await img.decode().catch(() => {});
    return () => {
      img.src = restore;
    };
  };

  return {
    bgSrc,
    bgPos,
    setBgPos,
    hasBackground: bgSrc != null,
    imgRef,
    setImage,
    swapFullForExport,
  };
}
