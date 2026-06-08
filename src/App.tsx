import { useRef, useState } from "react";
import { Stage } from "./components/Stage";
import { ClaimSticker } from "./components/ClaimSticker";
import { Controls } from "./components/Controls";
import { DEFAULT_DIMENSION, getDimension } from "./lib/dimensions";
import { exportStageToJpg } from "./lib/exportImage";
import type { Claim } from "./lib/types";

// Zufällige Neigung im CI-Bereich (−2.5° bis +2.5°).
const randomTilt = () => Math.round((Math.random() * 5 - 2.5) * 10) / 10;

export default function App() {
  const [dimensionKey, setDimensionKey] = useState(DEFAULT_DIMENSION.key);
  const [background, setBackground] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [claim, setClaim] = useState<Claim>({
    text: "",
    caps: true,
    tilt: randomTilt(),
    size: 0.11,
    style: "rose",
    x: 0.5,
    y: 0.62,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const dimension = getDimension(dimensionKey);

  const patchClaim = (patch: Partial<Claim>) => setClaim((c) => ({ ...c, ...patch }));

  const handleExport = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      await exportStageToJpg(
        stageRef.current,
        dimension.width,
        dimension.height,
        `freshpost-${dimension.key}.jpg`,
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app">
      <Controls
        claim={claim}
        dimension={dimension}
        onClaim={patchClaim}
        onDimension={setDimensionKey}
        onBackground={setBackground}
        onReroll={() => patchClaim({ tilt: randomTilt() })}
        onExport={handleExport}
        exporting={exporting}
      />
      <main className="canvas-area">
        <Stage
          ref={stageRef}
          dimension={dimension}
          background={background}
          showSafeZone={!exporting}
        >
          <ClaimSticker
            claim={claim}
            dimension={dimension}
            stageRef={stageRef}
            onChange={patchClaim}
          />
        </Stage>
      </main>
    </div>
  );
}
