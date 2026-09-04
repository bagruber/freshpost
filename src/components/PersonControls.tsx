import type { PersonState } from "../hooks/usePerson";
import type { PersonLook } from "../core/doc/claim";
import { SLIDER } from "../core/config";
import { Slider, Swatches, type SwatchItem } from "../core/input/controls";
import { useBrand } from "../brand/context";
import { requireImage } from "../brand/contract";

// Person-spezifische Controls: Look (als Vorschau-Kacheln des eigenen Bildes),
// Rahmenfarbe (Swatches), Größe (Standard); Rahmen-Feintuning (Advanced).

const LOOK_OPTIONS: { value: PersonLook; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "ci", label: "CI-Recolor" },
  { value: "bwriver", label: "S/W + River" },
];

export function PersonControls({ person, onRemoveBg }: { person: PersonState; onRemoveBg: () => void }) {
  const image = requireImage(useBrand());
  const item = person.item;
  if (!item) return null;
  const frameItems: SwatchItem<string>[] = image.frameColors.map((f) => ({
    value: f.key,
    label: f.label,
    color: f.hex,
  }));
  return (
    <>
      {item.opaque && (
        <div className="field">
          <button className="btn-secondary" onClick={onRemoveBg} disabled={person.busy}>
            Hintergrund entfernen
          </button>
          <span className="field-note">dauert meist 10–30 Sekunden</span>
        </div>
      )}
      <div className="field" role="radiogroup" aria-label="Person-Look">
        <span>Person-Look</span>
        <div className="tile-row">
          {LOOK_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={person.look === o.value}
              className={`tile${person.look === o.value ? " active" : ""}`}
              onClick={() => person.setLook(o.value)}
            >
              <span className="tile-preview tile-look">
                <img
                  src={o.value === "ci" ? item.ciUrl ?? item.pngUrl : item.pngUrl}
                  alt=""
                  style={o.value === "bwriver" ? { filter: image.personLookFilter } : undefined}
                />
              </span>
              <span className="tile-label">{o.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Swatches label="Rahmenfarbe" items={frameItems} value={person.frameColor} onChange={person.setFrameColor} />
      <Slider label={`Größe ${Math.round(item.scale * 100)}`}
        value={Math.round(item.scale * 100)} {...SLIDER.illuSize}
        onChange={(v) => person.setScale(v / 100)} />
    </>
  );
}

export function PersonAdvancedControls({ person }: { person: PersonState }) {
  if (!person.item) return null;
  return (
    <div className="grade-block">
      <p className="grade-title">Rahmen</p>
      <Slider label={`Dicke ${person.frameThickness}`} value={person.frameThickness} {...SLIDER.frameThickness}
        onChange={person.setFrameThickness} />
      <Slider label={`Rauheit ${person.frameRough}`} value={person.frameRough} {...SLIDER.frameRough}
        onChange={person.setFrameRough} />
    </div>
  );
}
