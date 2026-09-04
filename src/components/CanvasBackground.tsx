import { useMemo } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import type { Mode, BgPattern } from "../core/doc/claim";
import type { Dimension } from "../core/canvas/dimension";
import type { PhotoState } from "../hooks/usePhoto";
import { generateDotPattern } from "../core/canvas/patterns/dots";
import { generateLinePattern } from "../core/canvas/patterns/lines";
import { useBrand } from "../brand/context";

// Mode-abhängiger Stage-Hintergrund. Foto: pan/zoombarer BackgroundLayer.
// Illustration/Person: das BG-Rezept „Struktur in Grau + Marken-Tint als Multiply" —
// .illu-bg (heller Base, isolation) + Muster-Layer in Grau + .bg-tint
// (multiply) als letztes Kind. Foreground liegt außerhalb → unbeeinflusst.

type Props = {
  mode: Mode;
  bgPattern: BgPattern;
  dimension: Dimension;
  photo: PhotoState;
  stageRef: React.RefObject<HTMLDivElement | null>;
};

export function CanvasBackground({ mode, bgPattern, dimension, photo, stageRef }: Props) {
  const brand = useBrand();
  const patternUrl = useMemo(() => {
    if (mode === "photo") return null;
    if (bgPattern === "dots") return generateDotPattern(dimension.width, dimension.height);
    if (bgPattern === "lines") return generateLinePattern(dimension.width, dimension.height);
    return null;
  }, [mode, bgPattern, dimension]);

  if (mode !== "photo") {
    return (
      <div className="illu-bg">
        {bgPattern === "paper" && (
          <div className="bg-paper" style={{ backgroundImage: `url(${brand.surface.paperUrl})` }} />
        )}
        {bgPattern === "dots" && patternUrl && (
          <div className="bg-dots" style={{ backgroundImage: `url(${patternUrl})` }} />
        )}
        {bgPattern === "lines" && patternUrl && (
          <div className="bg-lines" style={{ backgroundImage: `url(${patternUrl})` }} />
        )}
        <div className="bg-tint" />
      </div>
    );
  }

  if (!photo.bgSrc) return null;
  return (
    <BackgroundLayer
      src={photo.bgSrc}
      imgRef={photo.imgRef}
      style={photo.transformStyle}
      stageRef={stageRef}
      dimension={dimension}
      geom={photo.geom}
      zoom={photo.zoom}
      pan={photo.pan}
      setView={photo.setView}
    />
  );
}
