import { useBrand } from "../brand/context";
import { getLayout } from "../brand/contract";
import { Slider, Toggle, Segmented, Swatches, Tiles, FileButton, type TileItem } from "../core/input/controls";
import { TEXTURES, TEXTURE_LABEL } from "../core/render/useGroundLayers";
import { LOGO_SIZES } from "../core/doc/logo";
import { ACCEPTED_TYPES } from "../core/media/image";
import { setText, setRoleStyle, type Composition, type Frame, type MediaItem } from "../core/doc/composition";

// Das Bedienfeld. Es kennt keine Marke: jede Auswahl entsteht aus dem, was das
// Marken-Paket deklariert — Layouts, Flaechen, Rollen, Palette, Logos. Was
// eine Marke nicht hat, erscheint hier gar nicht.

const IMG_ACCEPT = ACCEPTED_TYPES.join(",");
const randomTilt = () => Math.round((Math.random() * 2 - 1) * 5 * 10) / 10;

type Props = {
  doc: Composition;
  frame: Frame;
  frameNo: number;
  exporting: boolean;
  busy: boolean;
  error: string | null;
  shareSupported: boolean;
  onDoc: (patch: Partial<Composition>) => void;
  onFrame: (patch: Partial<Frame>) => void;
  onLayout: (key: string) => void;
  onAddImage: (file: File | undefined) => void;
  onMedia: (index: number, patch: Partial<MediaItem>) => void;
  onRemoveImage: (index: number) => void;
  onCutout: (index: number) => void;
  onExport: (share: boolean) => void;
};

export function ComposeControls(props: Props) {
  const { doc, frame, frameNo, exporting, busy, error, shareSupported } = props;
  const { onDoc, onFrame, onLayout, onAddImage, onMedia, onRemoveImage, onCutout, onExport } = props;
  const brand = useBrand();
  const layout = getLayout(brand, frame.layoutId);
  const spec = layout.media;

  const colors = brand.colors;
  const swatches = colors
    ? colors.order.map((k) => ({ value: k, label: colors.palette[k].label, color: colors.palette[k].bg }))
    : [];

  const surfaceTiles: TileItem<string>[] = brand.surfaces.map((s) => ({
    value: s.key,
    label: s.label,
    previewStyle: { background: s.bg },
  }));

  const anySticker = layout.slots.some((k) => brand.roles[k]?.sticker && frame.roleStyle[k]?.sticker);
  const marked = layout.slots.some((k) => brand.roles[k]?.emphasis?.length);
  const setTex = (side: "texBack" | "texFront", m: string, v: number) =>
    onDoc({ [side]: { ...doc[side], [m]: v } } as Partial<Composition>);

  return (
    <aside className="controls cx-controls">
      <h1 className="controls-title">{brand.label}</h1>
      {brand.type.substitute && (
        <p className="field-note">Schriften sind Ersatz aus Google Fonts, nicht die Hausschriften.</p>
      )}

      <div className="cx-panel">
        <h2 className="cx-panel-title">Bild {frameNo}</h2>

        <Segmented ariaLabel="Layout" label="Layout" value={frame.layoutId}
          options={brand.layouts.map((l) => ({ value: l.key, label: l.label }))}
          onChange={onLayout} />
        {layout.hint && <p className="field-note">{layout.hint}</p>}

        {layout.band !== "none" && (
          <Tiles label="Fläche" items={surfaceTiles} value={frame.surfaceKey ?? brand.surfaces[0].key}
            onChange={(k) => onFrame({ surfaceKey: k })} />
        )}

        {layout.slots.map((slot) => {
          const role = brand.roles[slot];
          if (!role) return null;
          const style = frame.roleStyle[slot] ?? {};
          return (
            <div className="cx-role" key={slot}>
              <label className="field">
                <span>{role.label}</span>
                <textarea
                  rows={role.multiline ? 3 : 1}
                  value={frame.text[slot] ?? ""}
                  placeholder={role.placeholder}
                  onChange={(e) => onFrame(setText(frame, slot, e.target.value))}
                />
              </label>
              {role.tint && colors && (
                <Swatches label={`Farbe ${role.label}`} items={swatches}
                  value={style.colorKey ?? colors.order[0]}
                  onChange={(v) => onFrame(setRoleStyle(frame, slot, { colorKey: v }))} />
              )}
              {role.sticker && colors && (
                <Toggle label={`${role.label} als Sticker`} checked={!!style.sticker}
                  onChange={(v) => onFrame(setRoleStyle(frame, slot, { sticker: v }))} />
              )}
            </div>
          );
        })}

        {marked && (
          <p className="field-note">
            Marker: <b>*Rose*</b>, <b>~Wind~</b>, <b>_Weiß_</b>. Enter = neuer Absatz; Leerzeichen und
            Tabs formen die Zeilen mit.
          </p>
        )}

        {anySticker && (
          <button type="button" className="btn-secondary" onClick={() => onFrame({ tilt: randomTilt() })}>
            Neigung würfeln
          </button>
        )}

        {spec.count > 0 && (
          <div className="field">
            <span>{spec.count > 1 ? "Bilder" : "Bild"}</span>
            {frame.media.slice(0, spec.count).map((m, i) => (
              <div key={i} className="cx-img-item">
                <div className="cx-img-row">
                  <span className="cx-img-name" title={m.name}>{m.name}</span>
                  <button type="button" className="btn-secondary cx-img-btn" disabled={busy}
                    onClick={() => onCutout(i)}>Freistellen</button>
                  <button type="button" className="btn-secondary cx-img-btn"
                    onClick={() => onRemoveImage(i)} aria-label="Bild entfernen">✕</button>
                </div>
                <Slider label={`Größe ${Math.round(m.scale * 100)}%`} value={Math.round(m.scale * 100)}
                  min={30} max={220} step={5} onChange={(v) => onMedia(i, { scale: v / 100 })} />
                {brand.creditLabel[m.kind] && (
                  <label className="field">
                    <span>Bildnachweis</span>
                    <textarea rows={1} value={m.credit} placeholder="Vorname Nachname / Agentur"
                      onChange={(e) => onMedia(i, { credit: e.target.value })} />
                  </label>
                )}
              </div>
            ))}
            {frame.media.length < spec.count && (
              <FileButton label={frame.media.length ? "Weiteres Bild …" : "Bild wählen …"}
                accept={IMG_ACCEPT} onFile={onAddImage} />
            )}
            {spec.frame && frame.media.length > 0 && brand.image && (
              <Toggle label="Freigestellt mit rauer Kante" checked={frame.roughFrame}
                onChange={(v) => onFrame({ roughFrame: v })} />
            )}
            {spec.tone && frame.media.length > 0 && (
              <Segmented ariaLabel="Bildmodus" value={frame.tone ? "tone" : "full"}
                options={[{ value: "tone", label: "Tonal (CI-Farbe)" }, { value: "full", label: "Vollfarbe" }]}
                onChange={(v) => onFrame({ tone: v === "tone" })} />
            )}
            {frame.media.length > 0 && <p className="field-note">Bild in der Vorschau ziehen zum Verschieben.</p>}
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div className="cx-panel">
        <h2 className="cx-panel-title">Ganze Folge</h2>

        {brand.formats.length > 1 && (
          <label className="field">
            <span>Format</span>
            <select value={doc.formatKey} onChange={(e) => onDoc({ formatKey: e.target.value })}>
              {brand.formats.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </label>
        )}

        <Tiles label="Durchlaufender Grund" value={doc.groundKey ?? ""}
          items={[{ value: "", label: "Keiner", previewClass: "tile-none" }, ...surfaceTiles]}
          onChange={(k) => onDoc({ groundKey: k === "" ? null : k })} />

        {brand.ground && (
          <div className="field">
            <span>Textur — hinten / vorne</span>
            {TEXTURES.map((m) => (
              <div key={m} className="cx-tex-row">
                <span className="cx-tex-label">{TEXTURE_LABEL[m]}</span>
                <Slider label={`hinten ${doc.texBack[m] ?? 0}`} value={doc.texBack[m] ?? 0} min={0} max={100} step={1}
                  onChange={(v) => setTex("texBack", m, v)} />
                <Slider label={`vorne ${doc.texFront[m] ?? 0}`} value={doc.texFront[m] ?? 0} min={0} max={100} step={1}
                  onChange={(v) => setTex("texFront", m, v)} />
              </div>
            ))}
          </div>
        )}

        {brand.logo.options.length > 0 && brand.logo.placements.length > 0 && (
          <>
            <Tiles label="Logo" value={doc.logoKey ?? ""}
              items={[
                { value: "", label: "Keins", previewClass: "tile-none" },
                ...brand.logo.options.map((l) => ({
                  value: l.key,
                  label: l.label,
                  previewClass: "tile-logo",
                  previewNode: <img src={l.url} alt="" />,
                })),
              ]}
              onChange={(k) => onDoc({ logoKey: k === "" ? null : k })} />
            {doc.logoKey && (
              <>
                <Segmented ariaLabel="Logo-Position" label="Position" value={doc.logoCorner}
                  options={brand.logo.placements.map((p) => ({ value: p.key, label: p.label }))}
                  onChange={(v) => onDoc({ logoCorner: v })} />
                <Segmented ariaLabel="Logo-Größe" label="Größe" value={doc.logoSize}
                  options={LOGO_SIZES.map((s) => ({ value: s, label: s === "s" ? "Klein" : "Groß" }))}
                  onChange={(v) => onDoc({ logoSize: v })} />
              </>
            )}
          </>
        )}

        {brand.progress && doc.frames.length > 1 && (
          <Segmented ariaLabel="Wischleiste" label="Wischleiste" value={doc.progress}
            options={[
              { value: "none" as const, label: "Aus" },
              { value: "top" as const, label: "Oben" },
              { value: "bottom" as const, label: "Unten" },
            ]}
            onChange={(v) => onDoc({ progress: v })} />
        )}
      </div>

      <div className="export-row">
        <button className="btn-primary" onClick={() => onExport(shareSupported)} disabled={exporting}>
          {exporting ? "Exportiere …" : shareSupported ? "Teilen" : `${doc.frames.length} JPG exportieren`}
        </button>
        {shareSupported && (
          <button className="btn-secondary" onClick={() => onExport(false)} disabled={exporting}>
            Speichern
          </button>
        )}
      </div>
    </aside>
  );
}
