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
