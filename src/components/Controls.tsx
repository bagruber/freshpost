import type { Claim, StickerStyle, Mode, BgPattern } from "../lib/types";
import { STYLES, STYLE_BG, SEC_MAX, boundaryOk, secondaryStyle } from "../lib/types";
import { SLIDER } from "../lib/config";
import { DIMENSIONS, type Dimension } from "../lib/dimensions";
import { ACCEPTED_TYPES } from "../lib/image";
import { ILLU_TYPES } from "../lib/illustration";
import { PERSON_TYPES } from "../lib/personImage";
import type { PhotoState } from "../hooks/usePhoto";
import type { IllustrationState } from "../hooks/useIllustration";
import type { PersonState } from "../hooks/usePerson";
import { PhotoControls, PhotoAdvancedControls } from "./PhotoControls";
import { IllustrationControls, IllustrationAdvancedControls } from "./IllustrationControls";
import { PersonControls, PersonAdvancedControls } from "./PersonControls";
import { Slider, Toggle, Swatches, FileButton, type SwatchItem } from "./inputs";
import paperUrl from "../assets/paper.jpg";

// Gemeinsames Bedien-UI (Mode, Claim, Format, Upload, Advanced-Claim-Regler);
// mode-spezifische Teile liegen in Photo-/Illustration-/PersonControls.

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
};

const ACCEPT: Record<Mode, string> = {
  photo: ACCEPTED_TYPES.join(","),
  illustration: ILLU_TYPES.join(","),
  person: PERSON_TYPES.join(","),
};
const UPLOAD_LABEL: Record<Mode, string> = {
  photo: "Hintergrundbild",
  illustration: "Illustration (SVG/PNG)",
  person: "Person (PNG, freigestellt)",
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

const PATTERN_OPTIONS: { value: BgPattern; label: string }[] = [
  { value: "paper", label: "Papier" },
  { value: "dots", label: "Punkte" },
  { value: "lines", label: "Linien" },
  { value: "none", label: "Keins" },
];

// Sticker-Farben als Chip-Reihe; verbotene Kombinationen ausgegraut.
function styleItems(isAllowed: (s: StickerStyle) => boolean): SwatchItem<StickerStyle>[] {
  return STYLES.map((s) => ({
    value: s.value,
    label: s.label,
    color: STYLE_BG[s.value],
    disabled: !isAllowed(s.value),
  }));
}

export function Controls(props: Props) {
  const {
    claim, dimension, advanced, mode, bgPattern, uploadError, photo, illu, person,
    onMode, onBgPattern, onClaim, onDimension, onFile, onAdvanced, onReroll,
  } = props;
  const isPhoto = mode === "photo";
  const isIllu = mode === "illustration";
  const isPerson = mode === "person";

  const noMain = claim.main.trim().length === 0;
  const hasUpper = claim.upper.trim().length > 0;
  const hasLower = claim.lower.trim().length > 0;

  const hasContent = isPhoto ? photo.hasBackground : isIllu ? illu.item != null : person.item != null;
  const onClear = isPhoto ? photo.clear : isIllu ? illu.clear : person.clear;

  const setMainStyle = (s: StickerStyle) => {
    const patch: Partial<Claim> = { mainStyle: s };
    if (hasUpper && !boundaryOk(claim.upperStyle, s)) patch.upperStyle = secondaryStyle(s);
    if (hasLower && !boundaryOk(claim.lowerStyle, s)) patch.lowerStyle = secondaryStyle(s);
    onClaim(patch);
  };

  return (
    <aside className="controls">
      <h1 className="controls-title">freshpost</h1>

      <div className="field" role="radiogroup" aria-label="Modus">
        <span>Modus</span>
        <div className="mode-toggle">
          {MODE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={mode === o.value}
              className={mode === o.value ? "active" : ""}
              onClick={() => onMode(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {!isPhoto && (
        <div className="field" role="radiogroup" aria-label="Hintergrund">
          <span>Hintergrund</span>
          <div className="tile-row">
            {PATTERN_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={bgPattern === o.value}
                className={`tile${bgPattern === o.value ? " active" : ""}`}
                onClick={() => onBgPattern(o.value)}
              >
                <span
                  className={`tile-preview tile-${o.value}`}
                  style={o.value === "paper" ? { backgroundImage: `url(${paperUrl})` } : undefined}
                />
                <span className="tile-label">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
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
          {DIMENSIONS.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </label>

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
      {isPerson && <PersonControls person={person} />}

      <button className="btn-secondary" onClick={onReroll}>Look würfeln</button>

      <Toggle label="Erweiterter Modus" checked={advanced} onChange={onAdvanced} />

      {advanced && (
        <div className="advanced">
          <Slider label={`Schriftgröße ${Math.round(claim.mainSize * 100)}`}
            value={claim.mainSize * 100} {...SLIDER.mainSize}
            onChange={(v) => onClaim({ mainSize: v / 100 })} />

          <Slider label={`Oben/Unten-Größe ${Math.round(claim.secScale * 100)}% von Claim`}
            value={Math.round(claim.secScale * 100)} min={SLIDER.secScaleMin} max={Math.round(SEC_MAX * 100)} step={1}
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
              items={styleItems((s) => boundaryOk(s, claim.mainStyle))}
              onChange={(s) => onClaim({ upperStyle: s })} />
          )}
          <Swatches label="Farbe Claim" value={claim.mainStyle}
            items={styleItems((s) =>
              (!hasUpper || boundaryOk(claim.upperStyle, s)) && (!hasLower || boundaryOk(claim.lowerStyle, s)))}
            onChange={setMainStyle} />
          {hasLower && (
            <Swatches label="Farbe Unten" value={claim.lowerStyle}
              items={styleItems((s) => boundaryOk(s, claim.mainStyle))}
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
