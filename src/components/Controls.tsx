import { useRef } from "react";
import type { Claim, StickerStyle } from "../lib/types";
import { STYLES, SEC_MAX, boundaryOk, secondaryStyle } from "../lib/types";
import type { Grade } from "../lib/ciFilter";
import { SLIDER } from "../lib/config";
import { DIMENSIONS, type Dimension } from "../lib/dimensions";
import { loadBackgroundImage, IMAGE_ERROR_TEXT, ACCEPTED_TYPES, type LoadedImage } from "../lib/image";
import { Slider, Toggle } from "./inputs";

type Props = {
  claim: Claim;
  dimension: Dimension;
  advanced: boolean;
  hasBackground: boolean;
  imgStrength: number; // 0..100 (Standard-Modus)
  grade: Grade; // Advanced-Werte 0..1
  onClaim: (patch: Partial<Claim>) => void;
  onDimension: (key: string) => void;
  onBackground: (img: LoadedImage | null) => void;
  onAdvanced: (on: boolean) => void;
  onReroll: () => void;
  onImgStrength: (v: number) => void;
  onGrade: (key: keyof Grade, v: number) => void;
  onExport: () => void;
  exporting: boolean;
};

const GRADE_FIELDS: { key: keyof Grade; label: string }[] = [
  { key: "cv", label: "Kontrast" },
  { key: "wm", label: "Wärme" },
  { key: "ro", label: "Rose" },
  { key: "wi", label: "Wind" },
  { key: "rv", label: "River" },
  { key: "bd", label: "Blau" },
];

function ColorSelect({
  label, value, isAllowed, onChange,
}: {
  label: string;
  value: StickerStyle;
  isAllowed: (s: StickerStyle) => boolean;
  onChange: (s: StickerStyle) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as StickerStyle)}>
        {STYLES.map((s) => (
          <option key={s.value} value={s.value} disabled={!isAllowed(s.value)}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Controls(props: Props) {
  const {
    claim, dimension, advanced, hasBackground, imgStrength, grade,
    onClaim, onDimension, onBackground, onAdvanced, onReroll,
    onImgStrength, onGrade, onExport, exporting,
  } = props;

  const errRef = useRef<HTMLParagraphElement>(null);
  const noMain = claim.main.trim().length === 0;
  const hasUpper = claim.upper.trim().length > 0;
  const hasLower = claim.lower.trim().length > 0;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      onBackground(await loadBackgroundImage(file));
      if (errRef.current) errRef.current.textContent = "";
    } catch (e) {
      if (errRef.current)
        errRef.current.textContent =
          IMAGE_ERROR_TEXT[e as keyof typeof IMAGE_ERROR_TEXT] ?? "Fehler";
    }
  };

  const setMainStyle = (s: StickerStyle) => {
    const patch: Partial<Claim> = { mainStyle: s };
    if (hasUpper && !boundaryOk(claim.upperStyle, s)) patch.upperStyle = secondaryStyle(s);
    if (hasLower && !boundaryOk(claim.lowerStyle, s)) patch.lowerStyle = secondaryStyle(s);
    onClaim(patch);
  };

  return (
    <aside className="controls">
      <h1 className="controls-title">freshpost</h1>

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
        <label className="field">
          <span>Farbe</span>
          <select value={claim.mainStyle} onChange={(e) => setMainStyle(e.target.value as StickerStyle)}>
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>Hintergrundbild</span>
        <input type="file" accept={ACCEPTED_TYPES.join(",")} onChange={(e) => handleFile(e.target.files?.[0])} />
      </label>
      <button className="btn-secondary" onClick={() => onBackground(null)}>Bild entfernen</button>
      <p ref={errRef} className="error" role="alert" />

      {hasBackground && !advanced && (
        <Slider label={`CI-Look ${imgStrength}`} value={imgStrength} min={0} max={100} step={1}
          onChange={onImgStrength} />
      )}

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
            <ColorSelect label="Farbe Oben" value={claim.upperStyle}
              isAllowed={(s) => boundaryOk(s, claim.mainStyle)} onChange={(s) => onClaim({ upperStyle: s })} />
          )}
          <ColorSelect label="Farbe Claim" value={claim.mainStyle}
            isAllowed={(s) => (!hasUpper || boundaryOk(claim.upperStyle, s)) && (!hasLower || boundaryOk(claim.lowerStyle, s))}
            onChange={setMainStyle} />
          {hasLower && (
            <ColorSelect label="Farbe Unten" value={claim.lowerStyle}
              isAllowed={(s) => boundaryOk(s, claim.mainStyle)} onChange={(s) => onClaim({ lowerStyle: s })} />
          )}

          <div className="caps-row">
            <Toggle label="Oben GROSS" checked={claim.capUpper} onChange={(v) => onClaim({ capUpper: v })} />
            <Toggle label="Claim GROSS" checked={claim.capMain} onChange={(v) => onClaim({ capMain: v })} />
            <Toggle label="Unten GROSS" checked={claim.capLower} onChange={(v) => onClaim({ capLower: v })} />
          </div>

          {hasBackground && (
            <div className="grade-block">
              <p className="grade-title">Bildlook</p>
              {GRADE_FIELDS.map((f) => (
                <Slider key={f.key} label={`${f.label} ${Math.round(grade[f.key] * 100)}`}
                  value={Math.round(grade[f.key] * 100)} min={0} max={100} step={1}
                  onChange={(v) => onGrade(f.key, v / 100)} />
              ))}
            </div>
          )}
        </div>
      )}

      <button className="btn-primary" onClick={onExport} disabled={exporting}>
        {exporting ? "Exportiere…" : "Als JPG exportieren"}
      </button>
    </aside>
  );
}
