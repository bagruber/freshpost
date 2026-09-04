import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { useBrand } from "../brand/context";
import { getLayout, getSurface } from "../brand/contract";
import { getDimension } from "../core/canvas/dimension";
import { Scaled } from "../core/canvas/Scaled";
import { renderStageToJpg, downloadBlob, shareBlob, canShareJpg } from "../core/canvas/exportImage";
import { FrameView } from "../core/render/FrameView";
import { ACCEPTED_TYPES } from "../core/media/image";
import { MAX_FILE_BYTES, readDataUrl } from "../core/media/readFile";
import { Segmented, Tiles, Slider, FileButton, type TileItem } from "../core/input/controls";
import {
  MAX_FRAMES, emptyMedia, frameId, patchFrame, pruneText, setText,
  type Composition, type Frame,
} from "../core/doc/composition";
import { loadComposition, saveComposition } from "./composeDraft";

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
  const [error, setError] = useState<string | null>(null);
  const [logoSvg, setLogoSvg] = useState<string>();

  const dimension = getDimension(brand.formats, doc.formatKey);
  const index = Math.max(0, doc.frames.findIndex((f) => f.id === selectedId));
  const frame = doc.frames[index];
  const layout = getLayout(brand, frame.layoutId);

  // Das Logo wird als Rohtext gebraucht, um es in die Farbe der Flaeche zu
  // faerben (siehe core/render/tintSvg).
  useEffect(() => {
    const url = brand.logo.options[0]?.url;
    if (!url) return setLogoSvg(undefined);
    let alive = true;
    fetch(url)
      .then((r) => r.text())
      .then((t) => alive && setLogoSvg(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [brand]);

  useEffect(() => {
    const t = setTimeout(() => saveComposition(doc), 400);
    return () => clearTimeout(t);
  }, [doc]);

  const patch = (p: Partial<Frame>) => setDoc((d) => patchFrame(d, selectedId, p));

  const onLayout = (key: string) => {
    const next = getLayout(brand, key);
    // Text, den das neue Layout nicht zeigt, faellt weg — sonst taucht er
    // beim Zurueckwechseln ueberraschend wieder auf.
    patch({ layoutId: key, text: pruneText(frame.text, next.slots) });
  };

  const addFrame = () => {
    if (doc.frames.length >= MAX_FRAMES) return;
    const nf: Frame = {
      id: frameId(),
      layoutId: brand.layouts[0].key,
      surfaceKey: brand.surfaces[0].key,
      text: {},
      media: [],
    };
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

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return setError("Format nicht unterstützt (JPG, PNG, WebP, AVIF).");
    if (file.size > MAX_FILE_BYTES) return setError("Datei zu groß (max. 15 MB).");
    try {
      const url = await readDataUrl(file);
      const keep = frame.media[0];
      patch({ media: [{ ...emptyMedia(url, file.name), credit: keep?.credit ?? "" }] });
      setError(null);
    } catch {
      setError("Bild konnte nicht gelesen werden.");
    }
  };

  const media = frame.media[0];
  const patchMedia = (p: Partial<typeof media>) =>
    media && patch({ media: [{ ...media, ...p }] });

  const surfaceTiles: TileItem<string>[] = brand.surfaces.map((s) => ({
    value: s.key,
    label: s.label,
    previewStyle: { background: s.bg },
  }));

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
          <FrameView frame={doc.frames[i]} brand={brand} dimension={dimension} logoSvg={logoSvg} />,
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

  const thumbTheme = useMemo(() => ({ brand, dimension, logoSvg }), [brand, dimension, logoSvg]);

  return (
    <div className="cx-app">
      <aside className="controls cx-controls">
        <h1 className="controls-title">{brand.label}</h1>
        {brand.type.substitute && (
          <p className="field-note">
            Schriften sind Ersatz aus Google Fonts, nicht die Hausschriften.
          </p>
        )}

        <div className="cx-panel">
          <h2 className="cx-panel-title">Bild {index + 1}</h2>

          <Segmented ariaLabel="Layout" label="Layout" value={frame.layoutId}
            options={brand.layouts.map((l) => ({ value: l.key, label: l.label }))}
            onChange={onLayout} />
          {layout.hint && <p className="field-note">{layout.hint}</p>}

          <Tiles label="Fläche" items={surfaceTiles} value={frame.surfaceKey ?? brand.surfaces[0].key}
            onChange={(k) => patch({ surfaceKey: k })} />

          {layout.slots.map((slot) => {
            const role = brand.roles[slot];
            if (!role) return null;
            return (
              <label className="field" key={slot}>
                <span>{role.label}</span>
                <textarea
                  rows={role.multiline ? 3 : 1}
                  value={frame.text[slot] ?? ""}
                  placeholder={role.placeholder}
                  onChange={(e) => patch(setText(frame, slot, e.target.value))}
                />
              </label>
            );
          })}

          {layout.media > 0 && (
            <div className="field">
              <span>Bild</span>
              <FileButton label={media ? "Bild ersetzen …" : "Bild wählen …"}
                accept={ACCEPTED_TYPES.join(",")} onFile={onFile} />
              {media && (
                <>
                  <Slider label={`Größe ${Math.round(media.scale * 100)}%`}
                    value={Math.round(media.scale * 100)} min={100} max={220} step={5}
                    onChange={(v) => patchMedia({ scale: v / 100 })} />
                  <label className="field">
                    <span>Bildnachweis</span>
                    <textarea rows={1} value={media.credit} placeholder="Vorname Nachname / Agentur"
                      onChange={(e) => patchMedia({ credit: e.target.value })} />
                  </label>
                </>
              )}
            </div>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </div>

        <div className="cx-panel">
          <h2 className="cx-panel-title">Ganze Folge</h2>
          {brand.formats.length > 1 && (
            <label className="field">
              <span>Format</span>
              <select value={doc.formatKey} onChange={(e) => setDoc((d) => ({ ...d, formatKey: e.target.value }))}>
                {brand.formats.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="export-row">
          <button className="btn-primary" onClick={() => handleExport(shareSupported)} disabled={exporting}>
            {exporting ? "Exportiere …" : shareSupported ? "Teilen" : `${doc.frames.length} JPG exportieren`}
          </button>
          {shareSupported && (
            <button className="btn-secondary" onClick={() => handleExport(false)} disabled={exporting}>
              Speichern
            </button>
          )}
        </div>
      </aside>

      <main className="cx-stage-area">
        <Scaled dimension={dimension} className="cx-preview">
          <FrameView frame={frame} brand={brand} dimension={dimension} logoSvg={logoSvg} interactive />
        </Scaled>
      </main>

      <div className="cx-strip">
        <div className="cx-slots">
          {doc.frames.map((f, i) => (
            <div key={f.id} className={`cx-slot${f.id === selectedId ? " active" : ""}`}>
              <button type="button" className="cx-slot-thumb-btn" onClick={() => setSelectedId(f.id)}>
                <span className="cx-slot-no">{i + 1}</span>
                <span className="cx-slot-thumb">
                  <Scaled dimension={dimension}>
                    <FrameView frame={f} {...thumbTheme} />
                  </Scaled>
                </span>
              </button>
              <span className="cx-slot-layout">{getSurface(brand, f.surfaceKey).label}</span>
              {doc.frames.length > 1 && (
                <button type="button" className="cx-slot-del" onClick={() => removeFrame(f.id)} aria-label="Bild entfernen">✕</button>
              )}
            </div>
          ))}
          {doc.frames.length < MAX_FRAMES && (
            <button type="button" className="cx-slot-add" onClick={addFrame}>
              <span className="cx-add-plus">＋</span>Bild
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
