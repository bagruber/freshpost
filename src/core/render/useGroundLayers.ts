import { useEffect, useMemo, useState } from "react";
import type { GroundCapability } from "../../brand/contract";
import type { Dimension } from "../canvas/dimension";
import type { TextureLevels } from "../doc/composition";
import { makePaperSheet, makeHalftoneSheet, makeGrain } from "./ground";

// Baut die Textur-Ebenen einer Composition — je Verfahren getrennt fuer HINTER
// dem Inhalt (back) und DAVOR (front). Papier und Halbton laufen als Blatt
// ueber je TEXTURE_SPAN Frames, Koernung kachelt.
//
// Ohne die Faehigkeit `ground` gibt es keine Ebenen. Der Hook wird trotzdem
// unbedingt aufgerufen — Hooks duerfen nicht bedingt laufen.

export const TEXTURES = ["paper", "halftone", "grain"] as const;
export type TextureMode = (typeof TEXTURES)[number];
export const TEXTURE_LABEL: Record<TextureMode, string> = {
  paper: "Papier",
  halftone: "Halbton",
  grain: "Körnung",
};
export const TEXTURE_SPAN = 4;

export type GroundLayer = {
  key: string;
  url: string;
  blend: string;
  opacity: number;
  place: "sheet" | "tile";
  span: number;
};

const FACTOR: Record<TextureMode, number> = { paper: 0.7, halftone: 1.0, grain: 0.65 };
// Papier per MULTIPLY (dunkelt nur ab, hellt nie auf); Halbton ebenso, Koernung
// als OVERLAY — so hellt keine Textur den Grund auf.
const BLEND: Record<TextureMode, string> = { paper: "multiply", halftone: "multiply", grain: "overlay" };

export type GroundLayers = { back: GroundLayer[]; front: GroundLayer[] };
const EMPTY: GroundLayers = { back: [], front: [] };

type Sheet = { key: string; url: string } | null;

export function useGroundLayers(
  ground: GroundCapability | undefined,
  texBack: TextureLevels,
  texFront: TextureLevels,
  dimension: Dimension,
  frameCount: number,
): GroundLayers {
  const { width, height } = dimension;
  const span = Math.min(Math.max(1, frameCount), TEXTURE_SPAN);
  const spanW = span * width;
  const sheetKey = `${spanW}x${height}`;
  const src = ground?.sheetUrl ?? "";
  const ink = ground?.halftoneInk ?? "";

  const level = (side: TextureLevels, m: TextureMode) => (ground ? side[m] ?? 0 : 0);
  const wantPaper = level(texBack, "paper") > 0 || level(texFront, "paper") > 0;
  const wantHalf = level(texBack, "halftone") > 0 || level(texFront, "halftone") > 0;

  const [paper, setPaper] = useState<Sheet>(null);
  const [half, setHalf] = useState<Sheet>(null);

  useEffect(() => {
    if (!wantPaper || !src) return;
    let alive = true;
    makePaperSheet(spanW, height, src).then((url) => alive && setPaper({ key: sheetKey, url })).catch(() => {});
    return () => {
      alive = false;
    };
  }, [wantPaper, spanW, height, sheetKey, src]);

  useEffect(() => {
    if (!wantHalf || !src) return;
    let alive = true;
    makeHalftoneSheet(spanW, height, src, ink).then((url) => alive && setHalf({ key: sheetKey, url })).catch(() => {});
    return () => {
      alive = false;
    };
  }, [wantHalf, spanW, height, sheetKey, src, ink]);

  const paperUrl = paper?.key === sheetKey ? paper.url : null;
  const halfUrl = half?.key === sheetKey ? half.url : null;

  return useMemo<GroundLayers>(() => {
    if (!ground) return EMPTY;
    const urlFor = (m: TextureMode): string | null =>
      m === "paper" ? paperUrl : m === "halftone" ? halfUrl : makeGrain();

    const build = (levels: TextureLevels, side: "b" | "f"): GroundLayer[] => {
      const out: GroundLayer[] = [];
      for (const m of TEXTURES) {
        const lvl = levels[m] ?? 0;
        const url = urlFor(m);
        if (lvl > 0 && url) {
          out.push({
            key: `${m}-${side}`,
            url,
            blend: BLEND[m],
            opacity: Math.min(1, FACTOR[m] * (lvl / 100)),
            place: m === "grain" ? "tile" : "sheet",
            span,
          });
        }
      }
      return out;
    };

    return { back: build(texBack, "b"), front: build(texFront, "f") };
  }, [ground, paperUrl, halfUrl, texBack, texFront, span]);
}
