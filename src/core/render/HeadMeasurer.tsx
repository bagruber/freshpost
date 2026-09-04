import { useLayoutEffect, useRef } from "react";
import type { Brand } from "../../brand/contract";
import { getLayout, getSurface } from "../../brand/contract";
import type { Dimension } from "../canvas/dimension";
import type { Frame } from "../doc/composition";
import { TextStack } from "./TextStack";

// Vermisst den Kopf jedes Frames OFFSCREEN und meldet je Layout das Maximum
// zurueck. Damit beginnen die Absaetze ueber alle Frames desselben Layouts auf
// gleicher Hoehe — sonst rutscht der Fliesstext von Bild zu Bild, je nachdem
// wie viele Zeilen die Ueberschrift gerade braucht.
//
// Nur Layouts mit `headSlots` haben einen Kopf; alle anderen kosten hier
// nichts.

export function HeadMeasurer({
  frames, brand, dimension, fontsReady, onHeights,
}: {
  frames: Frame[];
  brand: Brand;
  dimension: Dimension;
  fontsReady: boolean;
  onHeights: (h: Record<string, number>) => void;
}) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const measured = frames.filter((f) => (getLayout(brand, f.layoutId).headSlots ?? 0) > 0);

  useLayoutEffect(() => {
    const max: Record<string, number> = {};
    measured.forEach((f, i) => {
      const el = refs.current[i];
      if (!el) return;
      const key = getLayout(brand, f.layoutId).key;
      max[key] = Math.max(max[key] ?? 0, el.offsetHeight);
    });
    onHeights(max);
  });

  if (measured.length === 0) return null;

  return (
    <div className="fp-measurer" aria-hidden data-fonts={fontsReady ? "1" : "0"}>
      {measured.map((f, i) => {
        const layout = getLayout(brand, f.layoutId);
        return (
          <div key={f.id} style={{ width: Math.round(dimension.width * layout.textWidth) }}>
            <TextStack
              frame={f}
              brand={brand}
              surface={getSurface(brand, f.surfaceKey)}
              layout={layout}
              width={dimension.width}
              headOnly
              headRef={(el) => {
                refs.current[i] = el;
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
