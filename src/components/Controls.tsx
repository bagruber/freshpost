import { useRef } from "react";
import type { Claim } from "../lib/types";
import { STICKER_STYLES } from "../lib/types";
import { DIMENSIONS, type Dimension } from "../lib/dimensions";
import { loadBackgroundImage, IMAGE_ERROR_TEXT, ACCEPTED_TYPES } from "../lib/image";

type Props = {
  claim: Claim;
  dimension: Dimension;
  onClaim: (patch: Partial<Claim>) => void;
  onDimension: (key: string) => void;
  onBackground: (dataUrl: string | null) => void;
  onReroll: () => void;
  onExport: () => void;
  exporting: boolean;
};

export function Controls({
  claim,
  dimension,
  onClaim,
  onDimension,
  onBackground,
  onReroll,
  onExport,
  exporting,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await loadBackgroundImage(file);
      onBackground(url);
      if (errRef.current) errRef.current.textContent = "";
    } catch (e) {
      if (errRef.current) errRef.current.textContent = IMAGE_ERROR_TEXT[e as keyof typeof IMAGE_ERROR_TEXT] ?? "Fehler";
    }
  };

  return (
    <aside className="controls">
      <h1 className="controls-title">freshpost</h1>

      <label className="field">
        <span>Claim</span>
        <textarea
          value={claim.text}
          onChange={(e) => onClaim({ text: e.target.value })}
          rows={2}
          placeholder="Dein Claim"
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

      <label className="field">
        <span>Sticker-Stil</span>
        <select
          value={claim.style}
          onChange={(e) => onClaim({ style: e.target.value as Claim["style"] })}
        >
          {STICKER_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-inline">
        <input
          type="checkbox"
          checked={claim.caps}
          onChange={(e) => onClaim({ caps: e.target.checked })}
        />
        <span>GROSSBUCHSTABEN</span>
      </label>

      <label className="field">
        <span>Schriftgröße {Math.round(claim.size * 100)}</span>
        <input
          type="range"
          min={4}
          max={18}
          step={0.5}
          value={claim.size * 100}
          onChange={(e) => onClaim({ size: Number(e.target.value) / 100 })}
        />
      </label>

      <label className="field">
        <span>Neigung {claim.tilt.toFixed(1)}°</span>
        <input
          type="range"
          min={-6}
          max={6}
          step={0.1}
          value={claim.tilt}
          onChange={(e) => onClaim({ tilt: Number(e.target.value) })}
        />
      </label>

      <button className="btn-secondary" onClick={onReroll}>
        Neigung neu würfeln
      </button>

      <label className="field">
        <span>Hintergrundbild</span>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      <button className="btn-secondary" onClick={() => onBackground(null)}>
        Bild entfernen
      </button>
      <p ref={errRef} className="error" role="alert" />

      <button className="btn-primary" onClick={onExport} disabled={exporting}>
        {exporting ? "Exportiere…" : "Als JPG exportieren"}
      </button>
    </aside>
  );
}
