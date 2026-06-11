import { useRef } from "react";

// Kleine, wiederverwendbare Form-Controls für das Controls-Panel.

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

type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="field-inline">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

// Farb-Chips statt Text-Dropdown: Farbauswahl ist visuell. Verbotene
// Kombinationen (CI-Grenzregeln) erscheinen als ausgegraute Chips.
export type SwatchItem<V extends string> = {
  value: V;
  label: string;
  color: string; // CSS-Farbe (Token-var oder Hex aus Tokens)
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

// Gestylter Upload-Button statt nativem Datei-Input.
export function FileButton({
  label, accept, onFile,
}: {
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
          e.target.value = ""; // gleiche Datei erneut wählbar
        }}
      />
      <button type="button" className="btn-secondary btn-upload" onClick={() => ref.current?.click()}>
        {label}
      </button>
    </>
  );
}
