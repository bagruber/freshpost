import { useMemo } from "react";
import { BackgroundLayer } from "./BackgroundLayer";
import type { Mode, BgPattern } from "../lib/types";
import type { Dimension } from "../lib/dimensions";
import type { PhotoState } from "../hooks/usePhoto";
import { generateDotPattern } from "../lib/dotPattern";
import { generateLinePattern } from "../lib/linePattern";
import paperUrl from "../assets/paper.jpg";

// Mode-abhängiger Stage-Hintergrund. Foto: pan/zoombarer BackgroundLayer.
// Illustration/Person: das BG-Rezept „Struktur in Grau + #0b1316-Multiply" —
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
          <div className="bg-paper" style={{ backgroundImage: `url(${paperUrl})` }} />
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
