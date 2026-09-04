import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getDimension } from "../core/canvas/dimension";
import { renderStageToJpg, downloadBlob } from "../core/canvas/exportImage";
import { ACCEPTED_TYPES } from "../core/media/image";
import { MAX_FILE_BYTES, readDataUrl } from "../core/media/readFile";
import { Scaled } from "../core/canvas/Scaled";
import { BusyOverlay, CUTOUT_BUSY } from "../core/ui/BusyOverlay";

import { removePersonBackground } from "../core/media/removeBg";
import { CarouselControls } from "./CarouselControls";
import { Filmstrip } from "./Filmstrip";
import { SlideView, type RenderTheme } from "./SlideView";
import { HeaderMeasurer, type HeaderHeights } from "./HeaderMeasurer";
import { useLayers } from "./useLayers";
import { loadDoc, saveDoc } from "./carouselDraft";
import { MAX_SLIDES, maxImages, makeSlide, type CarouselDoc, type LayoutType, type Slide } from "./model";
import { useBrand } from "../brand/context";

const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const ZERO_HEIGHTS: HeaderHeights = { typo: 0, diagonal: 0, sidebar: 0, overlay: 0 };

export function CarouselApp() {
  const brand = useBrand();
  const [doc, setDoc] = useState<CarouselDoc>(() => loadDoc(brand));
  const [selectedId, setSelectedId] = useState(() => doc.slides[0].id);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false); // Freistellen läuft
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [headerMins, setHeaderMins] = useState<HeaderHeights>(ZERO_HEIGHTS);

  const dimension = getDimension(brand.formats, doc.dimensionKey);
  const total = doc.slides.length;

  const gradientCss = useMemo(
    () => {
      const gs = brand.surface.gradients;
      return (gs.find((g) => g.key === doc.gradient) ?? gs[0]).css;
    },
    [doc.gradient, brand],
  );
  const layers = useLayers(doc, dimension, brand.surface.sheetUrl);
  const logoUrl = brand.logo.options.find((o) => o.key === doc.logo)?.url ?? null;

  const theme: RenderTheme = useMemo(
    () => ({
      gradientCss,
      back: layers.back,
      front: layers.front,
      logoUrl,
      logoPos: doc.logoPos,
      swipeBottom: doc.swipeBottom,
      headerMins,
    }),
    [gradientCss, layers, logoUrl, doc.logoPos, doc.swipeBottom, headerMins],
  );

  const selectedIndex = Math.max(0, doc.slides.findIndex((s) => s.id === selectedId));
  const selected = doc.slides[selectedIndex];

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveDoc(doc), 400);
    return () => clearTimeout(t);
  }, [doc]);

  const onHeights = useCallback((h: HeaderHeights) => {
    setHeaderMins((prev) =>
      prev.typo === h.typo && prev.diagonal === h.diagonal && prev.sidebar === h.sidebar && prev.overlay === h.overlay ? prev : h,
    );
  }, []);

  const patchDoc = (patch: Partial<CarouselDoc>) => setDoc((d) => ({ ...d, ...patch }));

  const updateById = (id: string, fn: (s: Slide) => Slide) =>
    setDoc((d) => ({ ...d, slides: d.slides.map((s) => (s.id === id ? fn(s) : s)) }));
  const patchSlide = (patch: Partial<Slide>) => updateById(selectedId, (s) => ({ ...s, ...patch }));

  const addSlide = (layout?: LayoutType) => {
    if (doc.slides.length >= MAX_SLIDES) return;
    const main = brand.colors.order[0];
    const ns = makeSlide(layout ?? "typo", brand.surface.tones[0].key, main, brand.colors.secondaryFor(main));
    setDoc((d) => ({ ...d, slides: [...d.slides, ns] }));
    setSelectedId(ns.id);
  };

  const removeSlide = (id: string) => {
    setDoc((d) => {
      if (d.slides.length <= 1) return d;
      const idx = d.slides.findIndex((s) => s.id === id);
      const slides = d.slides.filter((s) => s.id !== id);
      if (id === selectedId) setSelectedId(slides[Math.min(idx, slides.length - 1)].id);
      return { ...d, slides };
    });
  };

  const moveSlide = (from: number, to: number) => {
    if (from === to) return;
    setDoc((d) => {
      const slides = [...d.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      return { ...d, slides };
    });
  };

  const setLayout = (id: string, layout: LayoutType) => {
    updateById(id, (s) => ({ ...s, layout }));
    setSelectedId(id);
  };

  const onImgMove = (x: number, y: number) => patchSlide({ imgOffX: x, imgOffY: y });

  const onAddImage = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return setUploadError("Format nicht unterstützt (JPG, PNG, WebP, AVIF).");
    if (file.size > MAX_FILE_BYTES) return setUploadError("Datei zu groß (max. 15 MB).");
    try {
      const url = await readDataUrl(file);
      updateById(selectedId, (s) => ({ ...s, images: [...s.images, { url, name: file.name, scale: 1 }].slice(0, maxImages(s.layout)) }));
      setUploadError(null);
    } catch {
      setUploadError("Bild konnte nicht gelesen werden.");
    }
  };

  const onRemoveImage = (index: number) =>
    updateById(selectedId, (s) => ({ ...s, images: s.images.filter((_, j) => j !== index) }));

  const onImageScale = (index: number, scale: number) =>
    updateById(selectedId, (s) => ({ ...s, images: s.images.map((im, j) => (j === index ? { ...im, scale } : im)) }));

  const onCutout = async (index: number) => {
    const id = selectedId;
    const target = doc.slides.find((s) => s.id === id)?.images[index];
    if (!target || busy) return;
    setBusy(true);
    try {
      const url = await removePersonBackground(target.url);
      updateById(id, (s) => ({ ...s, images: s.images.map((im, j) => (j === index ? { ...im, url } : im)) }));
      setUploadError(null);
    } catch {
      setUploadError("Freistellen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const host = document.createElement("div");
    host.style.cssText = `position:fixed;left:-99999px;top:0;width:${dimension.width}px;height:${dimension.height}px;`;
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      const slides = doc.slides;
      for (let i = 0; i < slides.length; i++) {
        root.render(
          <div style={{ width: dimension.width, height: dimension.height }}>
            <SlideView slide={slides[i]} index={i} total={slides.length} dimension={dimension} theme={theme} />
          </div>,
        );
        await raf();
        await raf();
        const el = host.firstElementChild as HTMLElement;
        const blob = await renderStageToJpg(el, dimension.width, dimension.height, brand.colors.exportBackground);
        downloadBlob(blob, `${brand.id}-${dimension.key}-${String(i + 1).padStart(2, "0")}.jpg`);
      }
    } finally {
      root.unmount();
      host.remove();
      setExporting(false);
    }
  };

  return (
    <div className="cx-app">
      <CarouselControls
        doc={doc}
        slide={selected}
        slideNo={selectedIndex + 1}
        exporting={exporting}
        busy={busy}
        onDoc={patchDoc}
        onSlide={patchSlide}
        onAddImage={onAddImage}
        onRemoveImage={onRemoveImage}
        onImageScale={onImageScale}
        onCutout={onCutout}
        onExport={handleExport}
      />
      <main className="cx-stage-area">
        {uploadError && <p className="error cx-upload-error" role="alert">{uploadError}</p>}
        <Scaled dimension={dimension} className="cx-preview">
          <SlideView slide={selected} index={selectedIndex} total={total} dimension={dimension} theme={theme} onImgMove={onImgMove} />
        </Scaled>
      </main>
      <Filmstrip
        slides={doc.slides}
        selectedId={selected.id}
        dimension={dimension}
        theme={theme}
        onSelect={setSelectedId}
        onAdd={addSlide}
        onRemove={removeSlide}
        onMove={moveSlide}
        onSetLayout={setLayout}
      />

      {/* Kopf-Höhen offscreen vermessen → einheitlicher Absatz-Beginn je Layout. */}
      <HeaderMeasurer slides={doc.slides} dimension={dimension} fontsReady={fontsReady} onHeights={onHeights} />

      {busy && <BusyOverlay {...CUTOUT_BUSY} />}
    </div>
  );
}
