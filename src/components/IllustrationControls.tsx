import type { IllustrationState } from "../hooks/useIllustration";
import { SLIDER } from "../lib/config";
import { Slider, Toggle } from "./inputs";

// Illustrations-spezifische Controls: Größen-Slider (Standard),
// CI-Recolor-Toggle für SVGs (Advanced).

export function IllustrationControls({ illu }: { illu: IllustrationState }) {
  if (!illu.item) return null;
  return (
    <Slider label={`Illustrationsgröße ${Math.round(illu.item.scale * 100)}`}
      value={Math.round(illu.item.scale * 100)} {...SLIDER.illuSize}
      onChange={(v) => illu.setScale(v / 100)} />
  );
}

export function IllustrationAdvancedControls({ illu }: { illu: IllustrationState }) {
  if (!illu.item?.isSvg) return null;
  return <Toggle label="CI-Recolor (SVG)" checked={illu.recolor} onChange={illu.setRecolor} />;
}
