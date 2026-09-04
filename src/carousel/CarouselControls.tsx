import type {
  CarouselDoc, Slide, LayoutType, SurfaceTone, StickerColor, GradientKey, TextureMode, LogoPos,
} from "./model";
import {
  LAYOUTS, LAYOUT_LABEL, SURFACE_LABEL, GRADIENTS, TEXTURES, TEXTURE_LABEL, STICKER_SWATCH, maxImages, randomTilt,
} from "./model";
import { DIMENSIONS } from "../lib/dimensions";
import { LOGOS } from "../lib/logos";
import { Slider, Toggle, Swatches, FileButton, Segmented } from "../core/input/controls";
import { ACCEPTED_TYPES } from "../lib/image";

const SURFACES: SurfaceTone[] = ["deep", "mid", "soft"];
const IMG_ACCEPT = ACCEPTED_TYPES.join(",");

type Props = {
  doc: CarouselDoc;
  slide: Slide;
  slideNo: number;
  exporting: boolean;
  busy: boolean;
  onDoc: (patch: Partial<CarouselDoc>) => void;
  onSlide: (patch: Partial<Slide>) => void;
  onAddImage: (file: File | undefined) => void;
  onRemoveImage: (index: number) => void;
  onImageScale: (index: number, scale: number) => void;
  onCutout: (index: number) => void;
  onExport: () => void;
};

export function CarouselControls(props: Props) {
  const { doc, slide, slideNo, exporting, busy, onDoc, onSlide, onAddImage, onRemoveImage, onImageScale, onCutout, onExport } = props;
  const isSidebar = slide.layout === "sidebar";
  const isOverlay = slide.layout === "overlay";
  const isDiagonal = slide.layout === "diagonal";
  const usesSurface = isDiagonal || isSidebar;
  const imgMax = maxImages(slide.layout);
  const anySticker = slide.kickerSticker || slide.headingSticker;

  const setTex = (side: "texBack" | "texFront", m: TextureMode, v: number) =>
    onDoc({ [side]: { ...doc[side], [m]: v } } as Partial<CarouselDoc>);

  return (
    <aside className="controls cx-controls">
      <h1 className="controls-title">Langtext</h1>

      <div className="cx-panel">
        <h2 className="cx-panel-title">Slide {slideNo}</h2>

        <Segmented ariaLabel="Layout" label="Layout" value={slide.layout}
          options={LAYOUTS.map((l) => ({ value: l, label: LAYOUT_LABEL[l] }))}
          onChange={(v: LayoutType) => onSlide({ layout: v })} />

        {usesSurface && (
          <Segmented ariaLabel="Textfläche" label="Textfläche (River-Ton)" value={slide.surface}
            options={SURFACES.map((s) => ({ value: s, label: SURFACE_LABEL[s] }))}
            onChange={(v: SurfaceTone) => onSlide({ surface: v })} />
        )}

        <label className="field">
          <span>Überzeile (optional)</span>
          <textarea rows={1} value={slide.kicker} placeholder="z. B. Kapitel 01"
            onChange={(e) => onSlide({ kicker: e.target.value })} />
        </label>
        <Swatches label="Farbe Überzeile" items={STICKER_SWATCH} value={slide.kickerColor}
          onChange={(v: StickerColor) => onSlide({ kickerColor: v })} />
        <Toggle label="Überzeile als Sticker" checked={slide.kickerSticker} onChange={(v) => onSlide({ kickerSticker: v })} />

        <label className="field">
          <span>Überschrift (optional)</span>
          <textarea rows={2} value={slide.heading} placeholder="Titel des Slides"
            onChange={(e) => onSlide({ heading: e.target.value })} />
        </label>
        <Swatches label="Farbe Überschrift" items={STICKER_SWATCH} value={slide.headingColor}
          onChange={(v: StickerColor) => onSlide({ headingColor: v })} />
        <Toggle label="Überschrift als Sticker" checked={slide.headingSticker} onChange={(v) => onSlide({ headingSticker: v })} />

        {anySticker && (
          <button type="button" className="btn-secondary" onClick={() => onSlide({ tilt: randomTilt() })}>
            Neigung würfeln
          </button>
        )}

        <label className="field">
          <span>{isSidebar ? "Text / Zitat" : "Fließtext"}</span>
          <textarea rows={5} value={slide.body} placeholder="Langtext …"
            onChange={(e) => onSlide({ body: e.target.value })} />
        </label>
        <p className="field-note">
          Marker: <b>*Rose*</b>, <b>~Wind~</b>, <b>_Weiß_</b>. Enter = neuer Absatz; Leerzeichen/Tabs
          formen die Zeilen mit.
        </p>

        {isSidebar && (
          <label className="field">
            <span>Quelle (Name / Rolle)</span>
            <textarea rows={2} value={slide.attribution} placeholder={"Maria Berger\nVorsitzende"}
              onChange={(e) => onSlide({ attribution: e.target.value })} />
          </label>
        )}

        {imgMax > 0 && (
          <div className="field">
            <span>{isOverlay ? "Bild (Overlay)" : isSidebar ? "Bilder (Person/Objekt, gemeinsame raue Kante)" : "Bild oben"}</span>
            {slide.images.map((im, i) => (
              <div key={i} className="cx-img-item">
                <div className="cx-img-row">
                  <span className="cx-img-name" title={im.name}>{im.name}</span>
                  <button type="button" className="btn-secondary cx-img-btn" disabled={busy} onClick={() => onCutout(i)}>Freistellen</button>
                  <button type="button" className="btn-secondary cx-img-btn" onClick={() => onRemoveImage(i)}>✕</button>
                </div>
                <Slider label={`Größe ${Math.round(im.scale * 100)}%`} value={Math.round(im.scale * 100)}
                  min={30} max={200} step={5} onChange={(v) => onImageScale(i, v / 100)} />
              </div>
            ))}
            {slide.images.length < imgMax && (
              <FileButton label={slide.images.length ? "Weiteres Bild …" : "Bild wählen …"} accept={IMG_ACCEPT} onFile={onAddImage} />
            )}
            {isDiagonal && slide.images.length > 0 && (
              <Toggle label="Bild oben freistellen (raue Kante)" checked={slide.imageRough} onChange={(v) => onSlide({ imageRough: v })} />
            )}
            {isOverlay && slide.images.length > 0 && (
              <Segmented ariaLabel="Bildmodus" value={slide.imageMode}
                options={[{ value: "duotone", label: "Tonal (CI-Farbe)" }, { value: "normal", label: "Vollfarbe" }]}
                onChange={(v) => onSlide({ imageMode: v })} />
            )}
            {slide.images.length > 0 && <p className="field-note">Bild in der Vorschau ziehen zum Verschieben.</p>}
          </div>
        )}
      </div>

      <div className="cx-panel">
        <h2 className="cx-panel-title">Ganze Folge</h2>

        <label className="field">
          <span>Format</span>
          <select value={doc.dimensionKey} onChange={(e) => onDoc({ dimensionKey: e.target.value })}>
            {DIMENSIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </label>

        <div className="field" role="radiogroup" aria-label="Verlauf">
          <span>Verlauf (läuft über alle Slides)</span>
          <div className="tile-row">
            {GRADIENTS.map((g) => (
              <button key={g.key} type="button" role="radio" aria-checked={doc.gradient === g.key}
                className={`tile${doc.gradient === g.key ? " active" : ""}`} onClick={() => onDoc({ gradient: g.key as GradientKey })}>
                <span className="tile-preview" style={{ backgroundImage: g.css }} />
                <span className="tile-label">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Textur — Intensität hinten / vorne (Papier/Halbton laufen durch)</span>
          {TEXTURES.map((m) => (
            <div key={m} className="cx-tex-row">
              <span className="cx-tex-label">{TEXTURE_LABEL[m]}</span>
              <Slider label={`hinten ${doc.texBack[m]}`} value={doc.texBack[m]} min={0} max={100} step={1}
                onChange={(v) => setTex("texBack", m, v)} />
              <Slider label={`vorne ${doc.texFront[m]}`} value={doc.texFront[m]} min={0} max={100} step={1}
                onChange={(v) => setTex("texFront", m, v)} />
            </div>
          ))}
        </div>

        {LOGOS.length > 0 && (
          <div className="field" role="radiogroup" aria-label="Logo">
            <span>Logo (mittig, klein)</span>
            <div className="tile-row">
              <button type="button" role="radio" aria-checked={doc.logo == null}
                className={`tile${doc.logo == null ? " active" : ""}`} onClick={() => onDoc({ logo: null })}>
                <span className="tile-preview tile-none" />
                <span className="tile-label">Keins</span>
              </button>
              {LOGOS.map((l) => (
                <button key={l.key} type="button" role="radio" aria-checked={doc.logo === l.key}
                  className={`tile${doc.logo === l.key ? " active" : ""}`} onClick={() => onDoc({ logo: l.key })}>
                  <span className="tile-preview tile-logo"><img src={l.url} alt="" /></span>
                  <span className="tile-label">{l.label}</span>
                </button>
              ))}
            </div>
            {doc.logo != null && (
              <Segmented ariaLabel="Logo-Position" value={doc.logoPos}
                options={[{ value: "top" as LogoPos, label: "Oben" }, { value: "bottom" as LogoPos, label: "Unten" }]}
                onChange={(v) => onDoc({ logoPos: v })} />
            )}
          </div>
        )}

        <Toggle label="Swipe-Leiste unten statt oben" checked={doc.swipeBottom} onChange={(v) => onDoc({ swipeBottom: v })} />
      </div>

      <button className="btn-primary" onClick={onExport} disabled={exporting}>
        {exporting ? "Exportiere …" : `Alle ${doc.slides.length} Slides exportieren`}
      </button>
    </aside>
  );
}
