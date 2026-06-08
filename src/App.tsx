import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "./components/Stage";
import { ClaimGroup } from "./components/ClaimGroup";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { Controls } from "./components/Controls";
import { DEFAULT_DIMENSION, getDimension, type Dimension } from "./lib/dimensions";
import { autoMainSize } from "./lib/layout";
import { exportStageToJpg } from "./lib/exportImage";
import { SEC_MAX, secondaryStyle, type Claim } from "./lib/types";

const randomTilt = () => Math.round((Math.random() * 8 - 4) * 10) / 10; // ±4°
const randomOffset = () => Math.round((Math.random() * 0.44 - 0.22) * 100) / 100; // ±0.22

type Size = { w: number; h: number };
type Pos = { x: number; y: number };

// Rotations-bewusste halbe Ausdehnung der Gruppe als Bruchteil der Stage.
function extents(size: Size, tilt: number, dim: Dimension) {
  const a = (tilt * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  return {
    hx: (size.w * c + size.h * s) / 2 / dim.width,
    hy: (size.w * s + size.h * c) / 2 / dim.height,
  };
}

// Auf den Canvas begrenzen (nicht auf die Safety-Zone).
function clampToCanvas(pos: Pos, ext: { hx: number; hy: number }): Pos {
  const fit = (v: number, h: number) => (h > 0.5 ? 0.5 : Math.min(1 - h, Math.max(h, v)));
  return { x: fit(pos.x, ext.hx), y: fit(pos.y, ext.hy) };
}

export default function App() {
  const [dimensionKey, setDimensionKey] = useState(DEFAULT_DIMENSION.key);
  const [background, setBackground] = useState<string | null>(null);
  const [bgPos, setBgPos] = useState<Pos>({ x: 50, y: 50 });
  const [advanced, setAdvanced] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [groupSize, setGroupSize] = useState<Size>({ w: 0, h: 0 });
  const [claim, setClaim] = useState<Claim>({
    upper: "",
    main: "",
    lower: "",
    capUpper: true,
    capMain: true,
    capLower: true,
    upperStyle: "white",
    mainStyle: "rose",
    lowerStyle: "white",
    tilt: randomTilt(),
    mainSize: 0.11,
    secScale: SEC_MAX,
    secOffset: 0,
    x: 0.5,
    y: 0.62,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const dimension = getDimension(dimensionKey);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Standard-Mode: Schriftgröße automatisch an die Safety-Zone anpassen.
  useEffect(() => {
    if (advanced) return;
    const a = autoMainSize(claim, dimension);
    setClaim((c) => (Math.abs(a - c.mainSize) < 0.0005 ? c : { ...c, mainSize: a }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, claim.upper, claim.main, claim.lower, claim.capUpper, claim.capMain, claim.capLower, dimension, fontsReady]);

  const patchClaim = (patch: Partial<Claim>) => setClaim((c) => ({ ...c, ...patch }));

  // Beim Verlassen des Advanced-Mode auf die Standard-Defaults zurücksetzen.
  const onAdvanced = (on: boolean) => {
    setAdvanced(on);
    if (!on) {
      setClaim((c) => ({
        ...c,
        secScale: SEC_MAX,
        secOffset: 0,
        capUpper: true,
        capMain: true,
        capLower: true,
        upperStyle: secondaryStyle(c.mainStyle),
        lowerStyle: secondaryStyle(c.mainStyle),
      }));
    }
  };

  const handleMeasure = useCallback((s: Size) => {
    setGroupSize((p) => (p.w === s.w && p.h === s.h ? p : s));
  }, []);

  const ext = useMemo(
    () => extents(groupSize, claim.tilt, dimension),
    [groupSize, claim.tilt, dimension],
  );

  const onDrag = (raw: Pos) => {
    const p = clampToCanvas(raw, ext);
    setClaim((c) => ({ ...c, x: p.x, y: p.y }));
  };

  const warnSafeZone = useMemo(() => {
    const s = dimension.safe;
    const eps = 0.002;
    return (
      claim.x - ext.hx < s.left - eps ||
      claim.x + ext.hx > 1 - s.right + eps ||
      claim.y - ext.hy < s.top - eps ||
      claim.y + ext.hy > 1 - s.bottom + eps
    );
  }, [claim.x, claim.y, ext, dimension]);

  const setNewBackground = (url: string | null) => {
    setBackground(url);
    setBgPos({ x: 50, y: 50 });
  };

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
        advanced={advanced}
        onClaim={patchClaim}
        onDimension={setDimensionKey}
        onBackground={setNewBackground}
        onAdvanced={onAdvanced}
        onRerollTilt={() => patchClaim({ tilt: randomTilt() })}
        onRerollOffset={() => patchClaim({ secOffset: randomOffset() })}
        onExport={handleExport}
        exporting={exporting}
      />
      <main className="canvas-area">
        <Stage
          ref={stageRef}
          dimension={dimension}
          showSafeZone={!exporting}
          warnSafeZone={warnSafeZone}
          background={
            background ? (
              <BackgroundLayer src={background} pos={bgPos} stageRef={stageRef} onChange={setBgPos} />
            ) : null
          }
        >
          <ClaimGroup
            claim={claim}
            dimension={dimension}
            stageRef={stageRef}
            onDrag={onDrag}
            onMeasure={handleMeasure}
          />
        </Stage>
        {warnSafeZone && <p className="zone-warning">⚠︎ Außerhalb der Safety-Zone</p>}
      </main>
    </div>
  );
}
