import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "./components/Stage";
import { ClaimGroup } from "./components/ClaimGroup";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { Controls } from "./components/Controls";
import { BottomSheet } from "./components/BottomSheet";
import { useBackgroundImage } from "./hooks/useBackgroundImage";
import { DEFAULT_DIMENSION, getDimension } from "./lib/dimensions";
import { autoMainSize } from "./lib/layout";
import { extents, clampToCanvas, violatesSafe, type Size, type Pos } from "./lib/geometry";
import { exportStageToJpg } from "./lib/exportImage";
import { SEC_MAX, secondaryStyle, type Claim } from "./lib/types";
import { GRADE_BASE, scaleGrade, type Grade } from "./lib/ciFilter";
import { RANDOM, DEFAULTS } from "./lib/config";

const rnd = (range: number) => Math.round((Math.random() * 2 - 1) * range * 100) / 100;
const randomTilt = () => rnd(RANDOM.tiltDeg);
const randomOffset = () => rnd(RANDOM.offset);

export default function App() {
  const [dimensionKey, setDimensionKey] = useState(DEFAULT_DIMENSION.key);
  const [advanced, setAdvanced] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [groupSize, setGroupSize] = useState<Size>({ w: 0, h: 0 });
  const [imgStrength, setImgStrength] = useState(DEFAULTS.imgStrength); // Standard: ein CI-Look-Regler
  const [gradeAdv, setGradeAdv] = useState<Grade>(() => scaleGrade(GRADE_BASE, DEFAULTS.gradeFactor));
  const [claim, setClaim] = useState<Claim>({
    upper: "", main: "", lower: "",
    capUpper: true, capMain: true, capLower: true,
    upperStyle: "white", mainStyle: "rose", lowerStyle: "white",
    tilt: randomTilt(),
    mainSize: DEFAULTS.mainSize,
    secScale: SEC_MAX,
    upperOffset: randomOffset(),
    lowerOffset: randomOffset(),
    x: 0.5, y: DEFAULTS.claimY,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const dimension = getDimension(dimensionKey);

  // Effektiver Grade: Advanced nutzt die Einzelregler, Standard skaliert den
  // empfohlenen Look mit dem einen CI-Look-Regler.
  const grade = useMemo<Grade>(
    () => (advanced ? gradeAdv : scaleGrade(GRADE_BASE, imgStrength / 100)),
    [advanced, gradeAdv, imgStrength],
  );
  const { bgSrc, bgPos, setBgPos, hasBackground, imgRef, setImage, swapFullForExport } =
    useBackgroundImage(grade);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Effektive Main-Größe wird abgeleitet (nicht gespeichert): Standard = auto
  // an die Safety-Zone, Advanced = manueller Wert.
  const effectiveMainSize = useMemo(
    () => (advanced ? claim.mainSize : autoMainSize(claim, dimension)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [advanced, claim.mainSize, claim.upper, claim.main, claim.lower,
     claim.capUpper, claim.capMain, claim.capLower, dimension, fontsReady],
  );

  const patchClaim = (patch: Partial<Claim>) => setClaim((c) => ({ ...c, ...patch }));

  const onAdvanced = (on: boolean) => {
    setAdvanced(on);
    if (on) {
      // Beim Wechsel in Advanced die Regler von den Standard-Werten übernehmen.
      setGradeAdv(scaleGrade(GRADE_BASE, imgStrength / 100));
      setClaim((c) => ({ ...c, mainSize: autoMainSize(c, dimension) }));
    } else {
      setClaim((c) => ({
        ...c,
        secScale: SEC_MAX,
        capUpper: true, capMain: true, capLower: true,
        upperStyle: secondaryStyle(c.mainStyle),
        lowerStyle: secondaryStyle(c.mainStyle),
      }));
    }
  };

  const onReroll = () =>
    patchClaim({ tilt: randomTilt(), upperOffset: randomOffset(), lowerOffset: randomOffset() });

  const handleMeasure = useCallback((s: Size) => {
    setGroupSize((p) => (p.w === s.w && p.h === s.h ? p : s));
  }, []);

  const ext = useMemo(() => extents(groupSize, claim.tilt, dimension), [groupSize, claim.tilt, dimension]);

  const onDrag = (raw: Pos) => {
    const p = clampToCanvas(raw, ext);
    setClaim((c) => ({ ...c, x: p.x, y: p.y }));
  };

  const warnSafeZone = useMemo(
    () => violatesSafe({ x: claim.x, y: claim.y }, ext, dimension.safe),
    [claim.x, claim.y, ext, dimension],
  );

  const handleExport = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    setExporting(true);
    try {
      const restore = await swapFullForExport();
      await exportStageToJpg(stage, dimension.width, dimension.height, `freshpost-${dimension.key}.jpg`);
      restore();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app">
      <BottomSheet warn={warnSafeZone}>
        <Controls
          claim={claim}
          dimension={dimension}
          advanced={advanced}
          hasBackground={hasBackground}
          imgStrength={imgStrength}
          grade={grade}
          onClaim={patchClaim}
          onDimension={setDimensionKey}
          onBackground={setImage}
          onAdvanced={onAdvanced}
          onReroll={onReroll}
          onImgStrength={setImgStrength}
          onGrade={(key, v) => setGradeAdv((g) => ({ ...g, [key]: v }))}
          onExport={handleExport}
          exporting={exporting}
        />
      </BottomSheet>
      <main className="canvas-area">
        <Stage
          ref={stageRef}
          dimension={dimension}
          showSafeZone={!exporting}
          warnSafeZone={warnSafeZone}
          background={
            bgSrc ? (
              <BackgroundLayer ref={imgRef} src={bgSrc} pos={bgPos} stageRef={stageRef} onChange={setBgPos} />
            ) : null
          }
        >
          <ClaimGroup
            claim={claim}
            mainSize={effectiveMainSize}
            dimension={dimension}
            stageRef={stageRef}
            onDrag={onDrag}
            onMeasure={handleMeasure}
          />
        </Stage>
      </main>
    </div>
  );
}
