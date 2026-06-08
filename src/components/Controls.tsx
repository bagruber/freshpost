import { useRef } from "react";
import type { Claim, StickerStyle } from "../lib/types";
import { STYLES, SEC_MAX, boundaryOk, secondaryStyle } from "../lib/types";
import { DIMENSIONS, type Dimension } from "../lib/dimensions";
import { loadBackgroundImage, IMAGE_ERROR_TEXT, ACCEPTED_TYPES } from "../lib/image";

type Props = {
  claim: Claim;
  dimension: Dimension;
  advanced: boolean;
  onClaim: (patch: Partial<Claim>) => void;
  onDimension: (key: string) => void;
  onBackground: (dataUrl: string | null) => void;
  onAdvanced: (on: boolean) => void;
  onRerollTilt: () => void;
  onRerollOffset: () => void;
  onExport: () => void;
  exporting: boolean;
};

// Farbauswahl mit deaktivierten Optionen, die gegen die Grenzregeln verstoßen.
function ColorSelect({
  label,
  value,
  isAllowed,
  onChange,
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

export function Controls({
  claim,
  dimension,
  advanced,
  onClaim,
  onDimension,
  onBackground,
  onAdvanced,
  onRerollTilt,
  onRerollOffset,
  onExport,
  exporting,
}: Props) {
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

  // Main-Farbe ändern: Oben/Unten reparieren, falls sie dann die Grenzregel
  // verletzen würden.
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
        <textarea
          value={claim.upper}
          onChange={(e) => onClaim({ upper: e.target.value })}
          rows={1}
          disabled={noMain}
          placeholder={noMain ? "erst Claim eingeben" : "kleiner Vortext"}
        />
      </label>

      <label className="field">
        <span>Claim</span>
        <textarea
          value={claim.main}
          onChange={(e) => onClaim({ main: e.target.value })}
          rows={2}
          placeholder="Dein Claim — Enter = neue Zeile"
        />
      </label>

      <label className="field">
        <span>Unten (optional)</span>
        <textarea
          value={claim.lower}
          onChange={(e) => onClaim({ lower: e.target.value })}
          rows={1}
          disabled={noMain}
          placeholder={noMain ? "erst Claim eingeben" : "kleiner Nachtext"}
        />
      </label>

      <label className="field">
        <span>Format</span>
        <select value={dimension.key} onChange={(e) => onDimension(e.target.value)}>
          {DIMENSIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      {!advanced && (
        <label className="field">
          <span>Farbe</span>
          <select value={claim.mainStyle} onChange={(e) => setMainStyle(e.target.value as StickerStyle)}>
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>Hintergrundbild</span>
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      <button className="btn-secondary" onClick={() => onBackground(null)}>
        Bild entfernen
      </button>
      <p ref={errRef} className="error" role="alert" />

      <button className="btn-secondary" onClick={onRerollTilt}>
        Neigung würfeln
      </button>
      <button className="btn-secondary" onClick={onRerollOffset}>
        Oben/Unten-Position würfeln
      </button>

      <label className="field-inline">
        <input type="checkbox" checked={advanced} onChange={(e) => onAdvanced(e.target.checked)} />
        <span>Erweiterter Modus</span>
      </label>

      {advanced && (
        <div className="advanced">
          <label className="field">
            <span>Schriftgröße {Math.round(claim.mainSize * 100)}</span>
            <input
              type="range"
              min={4}
              max={18}
              step={0.5}
              value={claim.mainSize * 100}
              onChange={(e) => onClaim({ mainSize: Number(e.target.value) / 100 })}
            />
          </label>

          <label className="field">
            <span>Oben/Unten-Größe {Math.round(claim.secScale * 100)}% von Claim</span>
            <input
              type="range"
              min={25}
              max={Math.round(SEC_MAX * 100)}
              step={1}
              value={Math.round(claim.secScale * 100)}
              onChange={(e) => onClaim({ secScale: Number(e.target.value) / 100 })}
            />
          </label>

          <label className="field">
            <span>Neigung {claim.tilt.toFixed(1)}°</span>
            <input
              type="range"
              min={-9}
              max={9}
              step={0.1}
              value={claim.tilt}
              onChange={(e) => onClaim({ tilt: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>Oben/Unten-Versatz {Math.round(claim.secOffset * 100)}</span>
            <input
              type="range"
              min={-35}
              max={35}
              step={1}
              value={Math.round(claim.secOffset * 100)}
              onChange={(e) => onClaim({ secOffset: Number(e.target.value) / 100 })}
            />
          </label>

          {hasUpper && (
            <ColorSelect
              label="Farbe Oben"
              value={claim.upperStyle}
              isAllowed={(s) => boundaryOk(s, claim.mainStyle)}
              onChange={(s) => onClaim({ upperStyle: s })}
            />
          )}
          <ColorSelect
            label="Farbe Claim"
            value={claim.mainStyle}
            isAllowed={(s) =>
              (!hasUpper || boundaryOk(claim.upperStyle, s)) &&
              (!hasLower || boundaryOk(claim.lowerStyle, s))
            }
            onChange={setMainStyle}
          />
          {hasLower && (
            <ColorSelect
              label="Farbe Unten"
              value={claim.lowerStyle}
              isAllowed={(s) => boundaryOk(s, claim.mainStyle)}
              onChange={(s) => onClaim({ lowerStyle: s })}
            />
          )}

          <div className="caps-row">
            <label className="field-inline">
              <input type="checkbox" checked={claim.capUpper} onChange={(e) => onClaim({ capUpper: e.target.checked })} />
              <span>Oben GROSS</span>
            </label>
            <label className="field-inline">
              <input type="checkbox" checked={claim.capMain} onChange={(e) => onClaim({ capMain: e.target.checked })} />
              <span>Claim GROSS</span>
            </label>
            <label className="field-inline">
              <input type="checkbox" checked={claim.capLower} onChange={(e) => onClaim({ capLower: e.target.checked })} />
              <span>Unten GROSS</span>
            </label>
          </div>
        </div>
      )}

      <button className="btn-primary" onClick={onExport} disabled={exporting}>
        {exporting ? "Exportiere…" : "Als JPG exportieren"}
      </button>
    </aside>
  );
}
