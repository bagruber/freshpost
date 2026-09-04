import { useLayoutEffect, useRef } from "react";
import type { Dimension } from "../lib/dimensions";
import type { Slide, LayoutType } from "./model";
import { LAYOUTS, textZoneWidth } from "./model";
import { Header } from "./layouts/parts";

// Vermisst die Kopf-Höhe (Überzeile + Überschrift) je Slide OFFSCREEN und meldet
// pro Layout das Maximum zurück. So können Absätze über Slides desselben Layouts
// einheitlich beginnen (siehe SlideView → Header minHeight).

export type HeaderHeights = Record<LayoutType, number>;

export function HeaderMeasurer({
  slides, dimension, fontsReady, onHeights,
}: {
  slides: Slide[];
  dimension: Dimension;
  fontsReady: boolean;
  onHeights: (h: HeaderHeights) => void;
}) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const max = {} as HeaderHeights;
    for (const l of LAYOUTS) max[l] = 0;
    slides.forEach((s, i) => {
      const el = refs.current[i];
      if (el) max[s.layout] = Math.max(max[s.layout], el.offsetHeight);
    });
    onHeights(max);
  });

  return (
    <div className="cx-measurer" aria-hidden data-fonts={fontsReady ? "1" : "0"}>
      {slides.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={{ width: textZoneWidth(s.layout, dimension.width) }}
        >
          <Header slide={s} dimension={dimension} />
        </div>
      ))}
    </div>
  );
}
