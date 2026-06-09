import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "./components/Stage";
import { ClaimGroup } from "./components/ClaimGroup";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { IllustrationLayer } from "./components/IllustrationLayer";
import { Controls } from "./components/Controls";
import { BottomSheet } from "./components/BottomSheet";
import { useBackgroundImage } from "./hooks/useBackgroundImage";
import { DEFAULT_DIMENSION, getDimension } from "./lib/dimensions";
import { autoMainSize } from "./lib/layout";
import { extents, clampToCanvas, violatesSafe, type Size, type Pos } from "./lib/geometry";
import { exportStageToJpg } from "./lib/exportImage";
import { loadBackgroundImage, IMAGE_ERROR_TEXT, ACCEPTED_TYPES } from "./lib/image";
import { loadIllustration, illuSrc, ILLU_ERROR_TEXT, ILLU_TYPES, type Illu } from "./lib/illustration";
import { SEC_MAX, secondaryStyle, type Claim, type Mode } from "./lib/types";
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [illu, setIllu] = useState<Illu | null>(null);
  const [recolor, setRecolor] = useState(true);
  const [illuSize, setIlluSize] = useState<Size>({ w: 0, h: 0 });
  const [claim, setClaim] = useState<Claim>({
    upper: "", main: "", lower: "",
    capUpper: true, capMain: true, capLower: true,
    upperStyle: "white", mainStyle: "rose", lowerStyle: "white",
    tilt: randomTilt(),
    mainSize: DEFAULTS.mainSize,
    stdScale: DEFAULTS.stdScale,
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
  const { bgSrc, hasBackground, imgRef, setImage, swapFullForExport, geom, zoom, pan, setView, transformStyle } =
    useBackgroundImage(grade, dimension);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Effektive Main-Größe wird abgeleitet (nicht gespeichert): Standard = auto
  // an die Safety-Zone, Advanced = manueller Wert.
  const effectiveMainSize = useMemo(
    () => (advanced ? claim.mainSize : autoMainSize(claim, dimension) * claim.stdScale),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [advanced, claim.mainSize, claim.stdScale, claim.upper, claim.main, claim.lower,
     claim.capUpper, claim.capMain, claim.capLower, dimension, fontsReady],
  );

  const patchClaim = (patch: Partial<Claim>) => setClaim((c) => ({ ...c, ...patch }));

  const onAdvanced = (on: boolean) => {
    setAdvanced(on);
    if (on) {
      // Beim Wechsel in Advanced die Regler von den Standard-Werten übernehmen.
      setGradeAdv(scaleGrade(GRADE_BASE, imgStrength / 100));
      setClaim((c) => ({ ...c, mainSize: autoMainSize(c, dimension) * c.stdScale }));
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

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      if (mode === "photo") {
        setImage(await loadBackgroundImage(file));
      } else {
        const loaded = await loadIllustration(file);
        setIllu({ ...loaded, x: 0.5, y: 0.5, scale: DEFAULTS.illuScale });
      }
      setUploadError(null);
    } catch (e) {
      const table = mode === "photo" ? IMAGE_ERROR_TEXT : ILLU_ERROR_TEXT;
      setUploadError(table[e as keyof typeof table] ?? "Fehler");
    }
  };

  const illuDisplaySrc = useMemo(() => (illu ? illuSrc(illu, recolor) : null), [illu, recolor]);
  const illuExt = useMemo(() => extents(illuSize, 0, dimension), [illuSize, dimension]);
  const onIlluDrag = (raw: Pos) => {
    const p = clampToCanvas(raw, illuExt);
    setIllu((i) => (i ? { ...i, x: p.x, y: p.y } : i));
  };

  const hasContent = mode === "photo" ? hasBackground : illu != null;

  const handleMeasure = useCallback((s: Size) => {
    setGroupSize((p) => (p.w === s.w && p.h === s.h ? p : s));
  }, []);

  // Dedupe wie beim Claim — sonst Endlosschleife (setState im Layout-Effekt).
  const handleIlluMeasure = useCallback((s: Size) => {
    setIlluSize((p) => (p.w === s.w && p.h === s.h ? p : s));
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
      <BottomSheet
        warn={warnSafeZone}
        header={
          <button className="btn-primary sheet-export" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exportiere…" : "JPG exportieren"}
          </button>
        }
      >
        <Controls
          claim={claim}
          dimension={dimension}
          advanced={advanced}
          mode={mode}
          hasBackground={hasBackground}
          hasIllu={illu != null}
          illuScale={illu?.scale ?? null}
          illuIsSvg={illu?.isSvg ?? false}
          recolor={recolor}
          imgStrength={imgStrength}
          grade={grade}
          uploadError={uploadError}
          onMode={setMode}
          onClaim={patchClaim}
          onDimension={setDimensionKey}
          onFile={handleFile}
          onClearBackground={() => setImage(null)}
          onClearIllu={() => setIllu(null)}
          onIlluScale={(v) => setIllu((i) => (i ? { ...i, scale: v } : i))}
          onRecolor={setRecolor}
          onAdvanced={onAdvanced}
          onReroll={onReroll}
          onImgStrength={setImgStrength}
          onGrade={(key, v) => setGradeAdv((g) => ({ ...g, [key]: v }))}
        />
      </BottomSheet>
      <main
        className="canvas-area"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={(mode === "photo" ? ACCEPTED_TYPES : ILLU_TYPES).join(",")}
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Stage
          ref={stageRef}
          dimension={dimension}
          showSafeZone={!exporting}
          warnSafeZone={warnSafeZone}
          background={
            mode === "illustration" ? (
              <div className="river-bg" />
            ) : bgSrc ? (
              <BackgroundLayer
                src={bgSrc}
                imgRef={imgRef}
                style={transformStyle}
                stageRef={stageRef}
                dimension={dimension}
                geom={geom}
                zoom={zoom}
                pan={pan}
                setView={setView}
              />
            ) : null
          }
        >
          {mode === "illustration" && illu && illuDisplaySrc && (
            <IllustrationLayer
              src={illuDisplaySrc}
              x={illu.x}
              y={illu.y}
              scale={illu.scale}
              dimension={dimension}
              stageRef={stageRef}
              onDrag={onIlluDrag}
              onMeasure={handleIlluMeasure}
            />
          )}
          {/* Dropzone liegt im Stage unter dem Claim (stage-relativ skaliert)
              und wird beim Export ausgeblendet. */}
          {!hasContent && !exporting && (
            <button
              className="canvas-dropzone"
              style={{ fontSize: dimension.width * 0.038 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="dz-plus">＋</span>
              {mode === "photo" ? "Foto hinzufügen" : "Illustration hinzufügen"}
              <span className="dz-hint">klicken oder hierher ziehen</span>
            </button>
          )}
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
