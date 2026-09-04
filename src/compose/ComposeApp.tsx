import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { useBrand } from "../brand/context";
import { getLayout, getSurface } from "../brand/contract";
import { getDimension } from "../core/canvas/dimension";
import { Scaled } from "../core/canvas/Scaled";
import { renderStageToJpg, downloadBlob, shareBlob, canShareJpg } from "../core/canvas/exportImage";
import { FrameView, type FrameTheme } from "../core/render/FrameView";
import { HeadMeasurer } from "../core/render/HeadMeasurer";
import { useGroundLayers } from "../core/render/useGroundLayers";
import { BusyOverlay, CUTOUT_BUSY } from "../core/ui/BusyOverlay";
import { removePersonBackground } from "../core/media/removeBg";
import { ACCEPTED_TYPES } from "../core/media/image";
import { MAX_FILE_BYTES, readDataUrl } from "../core/media/readFile";
import {
  MAX_FRAMES, emptyMedia, patchFrame, pruneText,
  type Composition, type Frame,
} from "../core/doc/composition";
import { ComposeControls } from "./ComposeControls";
import { Filmstrip } from "./Filmstrip";
import { defaultRough, emptyFrame, loadComposition, saveComposition } from "./composeDraft";

// Das gemeinsame Werkzeug: eine Composition aus 1..n Frames, gerendert vom
// markengetriebenen FrameView. Welche Layouts, Flaechen und Textrollen es
// gibt, steht im Marken-Paket — diese Datei kennt keine einzige davon
// namentlich.

const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const shareSupported = canShareJpg();

export function ComposeApp() {
  const brand = useBrand();
  const [doc, setDoc] = useState<Composition>(() => loadComposition(brand));
  const [selectedId, setSelectedId] = useState(() => doc.frames[0].id);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false); // Freistellen laeuft
  const [error, setError] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [headMins, setHeadMins] = useState<Record<string, number>>({});
  const [logoSvg, setLogoSvg] = useState<string>();

  const dimension = getDimension(brand.formats, doc.formatKey);
  const index = Math.max(0, doc.frames.findIndex((f) => f.id === selectedId));
  const frame = doc.frames[index];
  const layout = getLayout(brand, frame.layoutId);

  // Eine Marke ohne waehlbare Logo-Positionen setzt ihr Logo fest und faerbt
  // es in die Schriftfarbe der Flaeche — dafuer braucht es den Rohtext.
  const tintLogo = brand.logo.placements.length === 0;
  const logoUrl = tintLogo
    ? null
    : brand.logo.options.find((o) => o.key === doc.logoKey)?.url ?? null;

  useEffect(() => {
    const url = tintLogo ? brand.logo.options[0]?.url : undefined;
    if (!url) return setLogoSvg(undefined);
    let alive = true;
    fetch(url)
      .then((r) => r.text())
      .then((t) => alive && setLogoSvg(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [brand, tintLogo]);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveComposition(doc), 400);
    return () => clearTimeout(t);
  }, [doc]);

  const layers = useGroundLayers(brand.ground, doc.texBack, doc.texFront, dimension, doc.frames.length);

  const theme: FrameTheme = useMemo(
    () => ({
      ground: doc.groundKey ? getSurface(brand, doc.groundKey) : null,
      layers,
      progress: doc.progress,
      logoUrl,
      logoSvg,
      logoCorner: doc.logoCorner,
      logoSize: doc.logoSize,
      headMins,
    }),
    [brand, doc.groundKey, doc.progress, doc.logoCorner, doc.logoSize, layers, logoUrl, logoSvg, headMins],
  );

  const onHeights = useCallback((h: Record<string, number>) => {
    setHeadMins((prev) => {
      const keys = new Set([...Object.keys(prev), ...Object.keys(h)]);
      for (const k of keys) if ((prev[k] ?? 0) !== (h[k] ?? 0)) return h;
      return prev;
    });
  }, []);

  const patchDoc = (p: Partial<Composition>) => setDoc((d) => ({ ...d, ...p }));
  const patch = (p: Partial<Frame>) => setDoc((d) => patchFrame(d, selectedId, p));

  const onLayout = (key: string) => {
    const next = getLayout(brand, key);
    // Text, den das neue Layout nicht zeigt, faellt weg — sonst taucht er
    // beim Zurueckwechseln ueberraschend wieder auf. Bilder dagegen bleiben:
    // gerendert wird nur, was hineinpasst, und ein Wechsel hin und zurueck
    // soll nichts kosten.
    patch({
      layoutId: key,
      text: pruneText(frame.text, next.slots),
      tone: !!next.media.tone && frame.tone,
      roughFrame: defaultRough(next),
    });
  };

  const addFrame = (layoutId?: string) => {
    if (doc.frames.length >= MAX_FRAMES) return;
    const nf = emptyFrame(brand, layoutId);
    setDoc((d) => ({ ...d, frames: [...d.frames, nf] }));
    setSelectedId(nf.id);
  };

  const removeFrame = (id: string) =>
    setDoc((d) => {
      if (d.frames.length <= 1) return d;
      const i = d.frames.findIndex((f) => f.id === id);
      const frames = d.frames.filter((f) => f.id !== id);
      if (id === selectedId) setSelectedId(frames[Math.min(i, frames.length - 1)].id);
      return { ...d, frames };
    });

  const moveFrame = (from: number, to: number) =>
    setDoc((d) => {
      if (from === to) return d;
      const frames = [...d.frames];
      const [moved] = frames.splice(from, 1);
      frames.splice(to, 0, moved);
      return { ...d, frames };
    });

  const setFrameLayout = (id: string, layoutId: string) => {
    setSelectedId(id);
    setDoc((d) => patchFrame(d, id, { layoutId }));
  };

  const onAddImage = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return setError("Format nicht unterstützt (JPG, PNG, WebP, AVIF).");
    if (file.size > MAX_FILE_BYTES) return setError("Datei zu groß (max. 15 MB).");
    try {
      const url = await readDataUrl(file);
      patch({ media: [...frame.media, emptyMedia(url, file.name)].slice(0, layout.media.count) });
      setError(null);
    } catch {
      setError("Bild konnte nicht gelesen werden.");
    }
  };

  const patchMedia = (i: number, p: Partial<(typeof frame.media)[number]>) =>
    patch({ media: frame.media.map((m, j) => (j === i ? { ...m, ...p } : m)) });

  const removeImage = (i: number) => patch({ media: frame.media.filter((_, j) => j !== i) });

  const onCutout = async (i: number) => {
    const id = selectedId;
    const target = doc.frames.find((f) => f.id === id)?.media[i];
    if (!target || busy) return;
    setBusy(true);
    try {
      const url = await removePersonBackground(target.url);
      setDoc((d) =>
        patchFrame(d, id, {
          media: d.frames.find((f) => f.id === id)!.media.map((m, j) => (j === i ? { ...m, url } : m)),
        }),
      );
      setError(null);
    } catch {
      setError("Freistellen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (share: boolean) => {
    setExporting(true);
    const host = document.createElement("div");
    host.style.cssText = `position:fixed;left:-99999px;top:0;width:${dimension.width}px;height:${dimension.height}px;`;
    document.body.appendChild(host);
    const root = createRoot(host);
    const blobs: { blob: Blob; name: string }[] = [];
    try {
      for (let i = 0; i < doc.frames.length; i++) {
        root.render(
          <FrameView
            frame={doc.frames[i]}
            brand={brand}
            dimension={dimension}
            theme={theme}
            index={i}
            total={doc.frames.length}
          />,
        );
        // Zwei Frames warten: einer fuer das Rendern, einer fuer die Messung
        // der inhaltsbemessenen Flaeche.
        await raf();
        await raf();
        const el = host.firstElementChild as HTMLElement;
        const blob = await renderStageToJpg(el, dimension.width, dimension.height, brand.exportBackground);
        const n = doc.frames.length > 1 ? `-${String(i + 1).padStart(2, "0")}` : "";
        blobs.push({ blob, name: `${brand.id}-${dimension.key}${n}.jpg` });
      }
    } finally {
      root.unmount();
      host.remove();
      setExporting(false);
    }
    // Teilen nimmt alle Bilder auf einmal — mehrere Einzel-Downloads werden
    // von mobilen Browsern nach dem ersten blockiert.
    if (share && (await shareBlob(blobs.map((b) => b.blob), blobs.map((b) => b.name)))) return;
    for (const b of blobs) downloadBlob(b.blob, b.name);
  };

  return (
    <div className="cx-app">
      <ComposeControls
        doc={doc}
        frame={frame}
        frameNo={index + 1}
        exporting={exporting}
        busy={busy}
        error={error}
        shareSupported={shareSupported}
        onDoc={patchDoc}
        onFrame={patch}
        onLayout={onLayout}
        onAddImage={onAddImage}
        onMedia={patchMedia}
        onRemoveImage={removeImage}
        onCutout={onCutout}
        onExport={handleExport}
      />

      <main className="cx-stage-area">
        <Scaled dimension={dimension} className="cx-preview">
          <FrameView
            frame={frame}
            brand={brand}
            dimension={dimension}
            theme={theme}
            index={index}
            total={doc.frames.length}
            interactive
            onMediaMove={(x, y) => patch({ mediaOffX: x, mediaOffY: y })}
          />
        </Scaled>
      </main>

      <Filmstrip
        frames={doc.frames}
        selectedId={selectedId}
        dimension={dimension}
        theme={theme}
        onSelect={setSelectedId}
        onAdd={addFrame}
        onRemove={removeFrame}
        onMove={moveFrame}
        onSetLayout={setFrameLayout}
      />

      {/* Kopf-Hoehen offscreen vermessen → einheitlicher Absatz-Beginn. */}
      <HeadMeasurer
        frames={doc.frames}
        brand={brand}
        dimension={dimension}
        fontsReady={fontsReady}
        onHeights={onHeights}
      />

      {busy && <BusyOverlay {...CUTOUT_BUSY} />}
    </div>
  );
}
