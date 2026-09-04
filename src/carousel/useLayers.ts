import { useEffect, useMemo, useState } from "react";
import type { Dimension } from "../core/canvas/dimension";
import type { CarouselDoc, Layer, TextureMode } from "./model";
import { TEXTURES, TEXTURE_SPAN } from "./model";
import { makePaperSheet, makeHalftoneSheet, makeGrain } from "./paperTexture";

// Baut die Overlay-Ebenen aus den Textur-Intensitäten — je Art getrennt für
// HINTER dem Inhalt (back) und DAVOR (front). Papier/Halbton laufen als Blatt
// über je TEXTURE_SPAN Slides (durchlaufend), Körnung kachelt.

const FACTOR: Record<TextureMode, number> = { paper: 0.7, halftone: 1.0, grain: 0.65 };
// Papier per MULTIPLY (dunkelt nur ab, hellt nie auf); Halbton/Körnung dunkeln
// ebenfalls (dunkle Punkte/Rauschen), sodass die Textur den Grund nicht aufhellt.
const BLEND: Record<TextureMode, string> = { paper: "multiply", halftone: "multiply", grain: "overlay" };

export type Layers = { back: Layer[]; front: Layer[] };
type Sheet = { key: string; url: string } | null;

export function useLayers(doc: CarouselDoc, dimension: Dimension, sheetUrl: string): Layers {
  const { width, height } = dimension;
  const total = doc.slides.length;
  const texSpan = Math.min(total, TEXTURE_SPAN);
  const texW = texSpan * width;
  const texKey = `${texW}x${height}`;

  const { texBack, texFront } = doc;
  const wantPaper = texBack.paper > 0 || texFront.paper > 0;
  const wantHalf = texBack.halftone > 0 || texFront.halftone > 0;

  const [paper, setPaper] = useState<Sheet>(null);
  const [half, setHalf] = useState<Sheet>(null);

  useEffect(() => {
    if (!wantPaper) return;
    let alive = true;
    makePaperSheet(texW, height, sheetUrl).then((url) => alive && setPaper({ key: texKey, url })).catch(() => {});
    return () => {
      alive = false;
    };
  }, [wantPaper, texW, height, texKey, sheetUrl]);

  useEffect(() => {
    if (!wantHalf) return;
    let alive = true;
    makeHalftoneSheet(texW, height, sheetUrl).then((url) => alive && setHalf({ key: texKey, url })).catch(() => {});
    return () => {
      alive = false;
    };
  }, [wantHalf, texW, height, texKey, sheetUrl]);

  const paperUrl = paper?.key === texKey ? paper.url : null;
  const halfUrl = half?.key === texKey ? half.url : null;

  return useMemo<Layers>(() => {
    const urlFor = (m: TextureMode): string | null =>
      m === "paper" ? paperUrl : m === "halftone" ? halfUrl : makeGrain();

    const build = (levels: Record<TextureMode, number>, side: "b" | "f"): Layer[] => {
      const out: Layer[] = [];
      for (const m of TEXTURES) {
        const lvl = levels[m];
        const url = urlFor(m);
        if (lvl > 0 && url) {
          out.push({
            key: `${m}-${side}`,
            url,
            blend: BLEND[m],
            opacity: Math.min(1, FACTOR[m] * (lvl / 100)),
            place: m === "grain" ? "tile" : "sheet",
            span: texSpan,
          });
        }
      }
      return out;
    };

    return { back: build(texBack, "b"), front: build(texFront, "f") };
  }, [paperUrl, halfUrl, texBack, texFront, texSpan]);
}
