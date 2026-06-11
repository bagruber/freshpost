import type { PersonState } from "../hooks/usePerson";
import type { PersonLook, FrameColor } from "../lib/types";
import { SLIDER } from "../lib/config";
import { Slider } from "./inputs";

// Person-spezifische Controls: Look/Rahmenfarbe/Größe (Standard),
// Rahmen-Feintuning Dicke/Rauheit (Advanced).

export function PersonControls({ person }: { person: PersonState }) {
  if (!person.item) return null;
  return (
    <>
      <label className="field">
        <span>Person-Look</span>
        <select value={person.look} onChange={(e) => person.setLook(e.target.value as PersonLook)}>
          <option value="original">Original</option>
          <option value="ci">CI-Recolor</option>
          <option value="bwriver">S/W + River</option>
        </select>
      </label>
      <label className="field">
        <span>Rahmenfarbe</span>
        <select value={person.frameColor} onChange={(e) => person.setFrameColor(e.target.value as FrameColor)}>
          <option value="white">Weiß</option>
          <option value="river">River hell</option>
        </select>
      </label>
      <Slider label={`Größe ${Math.round(person.item.scale * 100)}`}
        value={Math.round(person.item.scale * 100)} {...SLIDER.illuSize}
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
