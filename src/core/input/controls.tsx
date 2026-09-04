import { useRef, type CSSProperties, type ReactNode } from "react";

// Bedien-Primitive fuer das Controls-Panel. Kennen keine Marke: Farben und
// Beschriftungen kommen ausschliesslich von aussen.

type SliderProps = {
  label: string; // bereits formatiert (inkl. Wert)
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

export function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Toggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="field-inline">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

// Segmentierter Umschalter fuer kurze, gleichrangige Optionen (Modus, Format-
// Variante, Ja/Nein-Paare).
export function Segmented<V extends string>({
  label, value, options, onChange, ariaLabel, className,
}: {
  label?: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className="field" role="radiogroup" aria-label={ariaLabel}>
      {label && <span>{label}</span>}
      <div className={`mode-toggle${className ? " " + className : ""}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={value === o.value ? "active" : ""}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Farb-Chips statt Text-Dropdown: Farbauswahl ist visuell. Was verboten ist,
// kommt als `disabled` herein — die Regel dazu gehoert der Marke, nicht hier.
export type SwatchItem<V extends string> = {
  value: V;
  label: string;
  color: string; // CSS-Farbe (Custom Property oder Hex)
  disabled?: boolean;
};

export function Swatches<V extends string>({
  label, items, value, onChange,
}: {
  label: string;
  items: SwatchItem<V>[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="field" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div className="swatch-row">
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={it.value === value}
            aria-label={it.label}
            title={it.label}
            className={`swatch${it.value === value ? " active" : ""}`}
            style={{ background: it.color }}
            disabled={it.disabled}
            onClick={() => onChange(it.value)}
          />
        ))}
      </div>
    </div>
  );
}

// Auswahl-Kacheln mit Vorschau (Muster, Verlaeufe, Logos, Looks).
export type TileItem<V extends string> = {
  value: V;
  label: string;
  previewClass?: string;
  previewStyle?: CSSProperties;
  previewNode?: ReactNode;
};

export function Tiles<V extends string>({
  label, items, value, onChange,
}: {
  label: string;
  items: TileItem<V>[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="field" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div className="tile-row">
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={it.value === value}
            className={`tile${it.value === value ? " active" : ""}`}
            onClick={() => onChange(it.value)}
          >
            <span className={`tile-preview${it.previewClass ? " " + it.previewClass : ""}`} style={it.previewStyle}>
              {it.previewNode}
            </span>
            <span className="tile-label">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Gestylter Upload-Button statt nativem Datei-Input.
export function FileButton({ label, accept, onFile }: {
  label: string;
  accept: string;
  onFile: (file: File | undefined) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = ""; // gleiche Datei erneut waehlbar
        }}
      />
      <button type="button" className="btn-secondary btn-upload" onClick={() => ref.current?.click()}>
        {label}
      </button>
    </>
  );
}
