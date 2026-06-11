import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { filterToDataUrl, type Grade } from "../lib/ciFilter";
import { coverGeom, clampView, type CoverGeom, type Pos } from "../lib/geometry";
import type { Dimension } from "../lib/dimensions";
import type { LoadedImage } from "../lib/image";

// Hintergrund-Pipeline: Originale als ImageData in Refs, angezeigt wird die
// gefilterte Vorschau (klein) als Data-URL. Pan/Zoom wie bei einer Karte —
// begrenzt auf Cover (Foto füllt immer) bis 1:1 (kein Upscaling).

export function useBackgroundImage(grade: Grade, dimension: Dimension) {
  const origFull = useRef<ImageData | null>(null);
  const origPreview = useRef<ImageData | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [srcDims, setSrcDims] = useState<{ w: number; h: number } | null>(null);
  const [rawZoom, setRawZoom] = useState(1);
  const [rawPan, setRawPan] = useState<Pos>({ x: 0, y: 0 });
  const [version, setVersion] = useState(0);

  // Live-Vorschau (klein), per rAF gedrosselt.
  useEffect(() => {
    const prev = origPreview.current;
    if (!prev) return;
    const raf = requestAnimationFrame(() => setBgSrc(filterToDataUrl(prev, grade)));
    return () => cancelAnimationFrame(raf);
  }, [grade, version]);

  const geom: CoverGeom | null = useMemo(
    () => (srcDims ? coverGeom(srcDims.w, srcDims.h, dimension) : null),
    [srcDims, dimension],
  );

  // Effektive (immer gültige) Sicht — abgeleitet statt korrigiert, damit ein
  // Formatwechsel ohne setState-im-Effekt in den Grenzen bleibt.
  const view = useMemo(
    () => (geom ? clampView(rawZoom, rawPan, geom, dimension) : { zoom: rawZoom, pan: rawPan }),
    [geom, dimension, rawZoom, rawPan],
  );

  const setView = (nextZoom: number, nextPan: Pos) => {
    setRawZoom(nextZoom);
    setRawPan(nextPan);
  };

  const setImage = (img: LoadedImage | null) => {
    if (!img) {
      origFull.current = null;
      origPreview.current = null;
      setBgSrc(null);
      setSrcDims(null);
      return;
    }
    origFull.current = img.full;
    origPreview.current = img.preview;
    setSrcDims({ w: img.full.width, h: img.full.height });
    setRawZoom(1);
    setRawPan({ x: 0, y: 0 });
    setVersion((v) => v + 1);
  };

  // Stil für das <img>: Cover-Größe × Zoom, zentriert plus Pan-Versatz.
  const transformStyle = useMemo<CSSProperties>(() => {
    if (!geom) return {};
    return {
      width: geom.imgW * view.zoom,
      height: geom.imgH * view.zoom,
      transform: `translate(calc(-50% + ${view.pan.x}px), calc(-50% + ${view.pan.y}px))`,
    };
  }, [geom, view]);

  // Für den Export kurz das voll aufgelöste, gefilterte Bild einsetzen.
  const swapFullForExport = async (): Promise<() => void> => {
    const img = imgRef.current;
    const full = origFull.current;
    if (!img || !full) return () => {};
    const restore = img.src;
    img.src = filterToDataUrl(full, grade, 0.97); // Export: höhere Qualität
    await img.decode().catch(() => {});
    return () => {
      img.src = restore;
    };
  };

  return {
    bgSrc,
    hasBackground: bgSrc != null,
    imgRef,
    setImage,
    swapFullForExport,
    geom,
    zoom: view.zoom,
    pan: view.pan,
    setView,
    transformStyle,
  };
}
