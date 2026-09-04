import type { Claim, Mode, BgPattern } from "../core/doc/claim";
import type { PaletteKey } from "../brand/contract";
import { SLIDER } from "../core/config";
import type { Dimension } from "../core/canvas/dimension";
import { ACCEPTED_TYPES } from "../core/media/image";
import { ILLU_TYPES } from "../core/media/illustration";
import { PERSON_TYPES } from "../core/media/personImage";
import { LOGO_SIZES, type LogoState, type LogoCorner, type LogoSize } from "../core/doc/logo";
import type { PhotoState } from "../hooks/usePhoto";
import type { IllustrationState } from "../hooks/useIllustration";
import type { PersonState } from "../hooks/usePerson";
import { PhotoControls, PhotoAdvancedControls } from "./PhotoControls";
import { IllustrationControls, IllustrationAdvancedControls } from "./IllustrationControls";
import { PersonControls, PersonAdvancedControls } from "./PersonControls";
import { Slider, Toggle, Swatches, Segmented, Tiles, FileButton, type SwatchItem, type TileItem } from "../core/input/controls";
import { useBrand } from "../brand/context";
import { requireColors, requireGround, requireSticker } from "../brand/contract";

// Gemeinsames Bedien-UI (Mode, Claim, Format, Upload, Advanced-Claim-Regler);
// mode-spezifische Teile liegen in Photo-/Illustration-/PersonControls.
// Farben, erlaubte Kombinationen, Formate und Logos kommen aus dem
// Marken-Paket — hier steht kein einziger Farbwert.

type Props = {
  claim: Claim;
  dimension: Dimension;
  advanced: boolean;
  mode: Mode;
  bgPattern: BgPattern;
  uploadError: string | null;
  photo: PhotoState;
  illu: IllustrationState;
  person: PersonState;
  onMode: (m: Mode) => void;
  onBgPattern: (p: BgPattern) => void;
  onClaim: (patch: Partial<Claim>) => void;
  onDimension: (key: string) => void;
  onFile: (file: File | undefined) => void;
  onAdvanced: (on: boolean) => void;
  onReroll: () => void;
  onRemoveBg: () => void;
  logo: LogoState;
  onLogo: (patch: Partial<LogoState>) => void;
};

const ACCEPT: Record<Mode, string> = {
  photo: ACCEPTED_TYPES.join(","),
  illustration: ILLU_TYPES.join(","),
  person: PERSON_TYPES.join(","),
};
const UPLOAD_LABEL: Record<Mode, string> = {
  photo: "Hintergrundbild",
  illustration: "Illustration (SVG/PNG)",
  person: "Person (Foto oder freigestelltes PNG)",
};
const CLEAR_LABEL: Record<Mode, string> = {
  photo: "Bild entfernen",
  illustration: "Illustration entfernen",
  person: "Person entfernen",
};

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "photo", label: "Foto" },
  { value: "illustration", label: "Illustration" },
  { value: "person", label: "Person" },
];

const PATTERNS: BgPattern[] = ["paper", "dots", "lines", "none"];
const PATTERN_LABEL: Record<BgPattern, string> = {
  paper: "Papier",
  dots: "Punkte",
  lines: "Linien",
  none: "Keins",
};

const LOGO_SIZE_LABEL: Record<LogoSize, string> = { s: "Klein", m: "Mittel" };

export function Controls(props: Props) {
  const {
    claim, dimension, advanced, mode, bgPattern, uploadError, photo, illu, person,
    onMode, onBgPattern, onClaim, onDimension, onFile, onAdvanced, onReroll, onRemoveBg,
    logo, onLogo,
  } = props;
  const brand = useBrand();
  const colors = requireColors(brand);
  const sticker = requireSticker(brand);
  const ground = requireGround(brand);
  const isPhoto = mode === "photo";
  const isIllu = mode === "illustration";
  const isPerson = mode === "person";

  const noMain = claim.main.trim().length === 0;
  const hasUpper = claim.upper.trim().length > 0;
  const hasLower = claim.lower.trim().length > 0;

  const hasContent = isPhoto ? photo.hasBackground : isIllu ? illu.item != null : person.item != null;
  const onClear = isPhoto ? photo.clear : isIllu ? illu.clear : person.clear;

  // Sticker-Farben als Chip-Reihe; was die Marke verbietet, kommt ausgegraut.
  const styleItems = (isAllowed: (s: PaletteKey) => boolean): SwatchItem<PaletteKey>[] =>
    colors.order.map((key) => ({
      value: key,
      label: colors.palette[key].label,
      color: colors.palette[key].bg,
      disabled: !isAllowed(key),
    }));

  const setMainStyle = (s: PaletteKey) => {
    const patch: Partial<Claim> = { mainStyle: s };
    if (hasUpper && !colors.adjacent(claim.upperStyle, s)) patch.upperStyle = colors.secondaryFor(s);
    if (hasLower && !colors.adjacent(claim.lowerStyle, s)) patch.lowerStyle = colors.secondaryFor(s);
    onClaim(patch);
  };

  const patternItems: TileItem<BgPattern>[] = PATTERNS.map((p) => ({
    value: p,
    label: PATTERN_LABEL[p],
    previewClass: `tile-${p}`,
    previewStyle: p === "paper" ? { backgroundImage: `url(${ground.paperUrl})` } : undefined,
  }));

  const logoItems: TileItem<string>[] = [
    { value: "", label: "Keins", previewClass: "tile-none" },
    ...brand.logo.options.map((l) => ({
      value: l.key,
      label: l.label,
      previewClass: "tile-logo",
      previewNode: <img src={l.url} alt="" />,
    })),
  ];

  return (
    <aside className="controls">
      <h1 className="controls-title">freshpost</h1>

      <Segmented ariaLabel="Modus" label="Modus" value={mode} options={MODE_OPTIONS} onChange={onMode} />

      {!isPhoto && (
        <Tiles label="Hintergrund" items={patternItems} value={bgPattern} onChange={onBgPattern} />
      )}

      <label className="field">
        <span>Oben (optional)</span>
        <textarea value={claim.upper} onChange={(e) => onClaim({ upper: e.target.value })}
          rows={1} disabled={noMain} placeholder={noMain ? "erst Claim eingeben" : "kleiner Vortext"} />
      </label>

      <label className="field">
        <span>Claim</span>
        <textarea value={claim.main} onChange={(e) => onClaim({ main: e.target.value })}
          rows={2} placeholder="Dein Claim — Enter = neue Zeile" />
      </label>

      <label className="field">
        <span>Unten (optional)</span>
        <textarea value={claim.lower} onChange={(e) => onClaim({ lower: e.target.value })}
          rows={1} disabled={noMain} placeholder={noMain ? "erst Claim eingeben" : "kleiner Nachtext"} />
      </label>

      <label className="field">
        <span>Format</span>
        <select value={dimension.key} onChange={(e) => onDimension(e.target.value)}>
          {brand.formats.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </label>

      {brand.logo.options.length > 0 && (
        <>
          <Tiles label="Logo" items={logoItems} value={logo.key ?? ""}
            onChange={(k) => onLogo({ key: k === "" ? null : k })} />
          {logo.key != null && (
            <div className="logo-opts">
              <div className="corner-grid" role="radiogroup" aria-label="Logo-Ecke">
                {brand.logo.placements.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    role="radio"
                    aria-checked={logo.corner === c.key}
                    className={logo.corner === c.key ? "active" : ""}
                    onClick={() => onLogo({ corner: c.key as LogoCorner })}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <Segmented ariaLabel="Logo-Größe" className="logo-size" value={logo.size}
                options={LOGO_SIZES.map((s) => ({ value: s, label: LOGO_SIZE_LABEL[s] }))}
                onChange={(s) => onLogo({ size: s })} />
            </div>
          )}
        </>
      )}

      {!advanced && (
        <Slider label={`Textgröße ${Math.round(claim.stdScale * 100)}`}
          value={Math.round(claim.stdScale * 100)} {...SLIDER.stdSize}
          onChange={(v) => onClaim({ stdScale: v / 100 })} />
      )}

      {!advanced && (
        <Swatches label="Farbe" items={styleItems(() => true)} value={claim.mainStyle} onChange={setMainStyle} />
      )}

      <div className="field">
        <span>{UPLOAD_LABEL[mode]}</span>
        <FileButton label="Datei wählen …" accept={ACCEPT[mode]} onFile={onFile} />
      </div>
      {hasContent && (
        <button className="btn-secondary" onClick={onClear}>{CLEAR_LABEL[mode]}</button>
      )}
      {uploadError && <p className="error" role="alert">{uploadError}</p>}

      {isPhoto && <PhotoControls photo={photo} advanced={advanced} />}
      {isIllu && <IllustrationControls illu={illu} />}
      {isPerson && <PersonControls person={person} onRemoveBg={onRemoveBg} />}

      <button className="btn-secondary" onClick={onReroll}>Look würfeln</button>

      <Toggle label="Erweiterter Modus" checked={advanced} onChange={onAdvanced} />

      {advanced && (
        <div className="advanced">
          <Slider label={`Schriftgröße ${Math.round(claim.mainSize * 100)}`}
            value={claim.mainSize * 100} {...SLIDER.mainSize}
            onChange={(v) => onClaim({ mainSize: v / 100 })} />

          <Slider label={`Oben/Unten-Größe ${Math.round(claim.secScale * 100)}% von Claim`}
            value={Math.round(claim.secScale * 100)} min={SLIDER.secScaleMin}
            max={Math.round(sticker.secondaryMax * 100)} step={1}
            onChange={(v) => onClaim({ secScale: v / 100 })} />

          <Slider label={`Neigung ${claim.tilt.toFixed(1)}°`}
            value={claim.tilt} {...SLIDER.tiltDeg}
            onChange={(v) => onClaim({ tilt: v })} />

          <Slider label={`Versatz Oben ${Math.round(claim.upperOffset * 100)}`}
            value={Math.round(claim.upperOffset * 100)} {...SLIDER.offset}
            onChange={(v) => onClaim({ upperOffset: v / 100 })} />
          <Slider label={`Versatz Unten ${Math.round(claim.lowerOffset * 100)}`}
            value={Math.round(claim.lowerOffset * 100)} {...SLIDER.offset}
            onChange={(v) => onClaim({ lowerOffset: v / 100 })} />

          {hasUpper && (
            <Swatches label="Farbe Oben" value={claim.upperStyle}
              items={styleItems((s) => colors.adjacent(s, claim.mainStyle))}
              onChange={(s) => onClaim({ upperStyle: s })} />
          )}
          <Swatches label="Farbe Claim" value={claim.mainStyle}
            items={styleItems((s) =>
              (!hasUpper || colors.adjacent(claim.upperStyle, s)) &&
              (!hasLower || colors.adjacent(claim.lowerStyle, s)))}
            onChange={setMainStyle} />
          {hasLower && (
            <Swatches label="Farbe Unten" value={claim.lowerStyle}
              items={styleItems((s) => colors.adjacent(s, claim.mainStyle))}
              onChange={(s) => onClaim({ lowerStyle: s })} />
          )}

          <div className="caps-row">
            <Toggle label="Oben GROSS" checked={claim.capUpper} onChange={(v) => onClaim({ capUpper: v })} />
            <Toggle label="Claim GROSS" checked={claim.capMain} onChange={(v) => onClaim({ capMain: v })} />
            <Toggle label="Unten GROSS" checked={claim.capLower} onChange={(v) => onClaim({ capLower: v })} />
          </div>

          {isIllu && <IllustrationAdvancedControls illu={illu} />}
          {isPerson && <PersonAdvancedControls person={person} />}
          {isPhoto && <PhotoAdvancedControls photo={photo} />}
        </div>
      )}
    </aside>
  );
}
