import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "./components/Stage";
import { ClaimGroup } from "./components/ClaimGroup";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { IllustrationLayer } from "./components/IllustrationLayer";
import { PersonLayer } from "./components/PersonLayer";
import { Controls } from "./components/Controls";
import { BottomSheet } from "./components/BottomSheet";
import { useBackgroundImage } from "./hooks/useBackgroundImage";
import { DEFAULT_DIMENSION, getDimension } from "./lib/dimensions";
import { autoMainSize } from "./lib/layout";
import { extents, clampToCanvas, violatesSafe, type Size, type Pos } from "./lib/geometry";
import { exportStageToJpg } from "./lib/exportImage";
import { loadBackgroundImage, IMAGE_ERROR_TEXT, ACCEPTED_TYPES } from "./lib/image";
import { loadIllustration, illuSrc, ILLU_ERROR_TEXT, ILLU_TYPES, type Illu } from "./lib/illustration";
import { loadPersonFile, recolorPersonToCI, PERSON_TYPES, PERSON_ERROR_TEXT } from "./lib/personImage";
import { SEC_MAX, secondaryStyle, type Claim, type Mode, type BgPattern, type PersonLook, type FrameColor } from "./lib/types";
import { GRADE_BASE, scaleGrade, type Grade } from "./lib/ciFilter";
import { generateDotPattern } from "./lib/dotPattern";
import { generateLinePattern } from "./lib/linePattern";
import { RANDOM, DEFAULTS } from "./lib/config";
import paperUrl from "./assets/paper.jpg";

// S/W + River-Tint als CSS-Farbfilter (Person-Look).
const BWRIVER_FILTER = "grayscale(1) brightness(1.05) sepia(1) hue-rotate(155deg) saturate(2.2)";
const FRAME_HEX: Record<FrameColor, string> = { white: "#ffffff", river: "#466e7f" };

type Person = { pngUrl: string; ciUrl: string | null; x: number; y: number; scale: number };

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
  const [bgPattern, setBgPattern] = useState<BgPattern>("paper");
  const [person, setPerson] = useState<Person | null>(null);
  const [personLook, setPersonLook] = useState<PersonLook>("original");
  const [frameColor, setFrameColor] = useState<FrameColor>("white");
  const [frameThickness, setFrameThickness] = useState(DEFAULTS.frameThickness);
  const [frameRough, setFrameRough] = useState(DEFAULTS.frameRough);
  const [personSize, setPersonSize] = useState<Size>({ w: 0, h: 0 });
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
      } else if (mode === "illustration") {
        const loaded = await loadIllustration(file);
        setIllu({ ...loaded, x: 0.5, y: 0.5, scale: DEFAULTS.illuScale });
      } else {
        const pngUrl = await loadPersonFile(file);
        setPerson({ pngUrl, ciUrl: null, x: 0.5, y: 0.5, scale: DEFAULTS.personScale });
        recolorPersonToCI(pngUrl)
          .then((ciUrl) => setPerson((p) => (p && p.pngUrl === pngUrl ? { ...p, ciUrl } : p)))
          .catch(() => {});
      }
      setUploadError(null);
    } catch (e) {
      const table =
        mode === "photo" ? IMAGE_ERROR_TEXT : mode === "illustration" ? ILLU_ERROR_TEXT : PERSON_ERROR_TEXT;
      setUploadError(table[e as keyof typeof table] ?? "Fehler");
    }
  };

  const illuDisplaySrc = useMemo(() => (illu ? illuSrc(illu, recolor) : null), [illu, recolor]);
  const illuExt = useMemo(() => extents(illuSize, 0, dimension), [illuSize, dimension]);
  const onIlluDrag = (raw: Pos) => {
    const p = clampToCanvas(raw, illuExt);
    setIllu((i) => (i ? { ...i, x: p.x, y: p.y } : i));
  };

  const personSrc = person ? (personLook === "ci" ? person.ciUrl ?? person.pngUrl : person.pngUrl) : null;
  const personExt = useMemo(() => extents(personSize, 0, dimension), [personSize, dimension]);
  const onPersonDrag = (raw: Pos) => {
    const p = clampToCanvas(raw, personExt);
    setPerson((i) => (i ? { ...i, x: p.x, y: p.y } : i));
  };

  const hasContent =
    mode === "photo" ? hasBackground : mode === "illustration" ? illu != null : person != null;

  const patternUrl = useMemo(() => {
    if (mode === "photo") return null;
    if (bgPattern === "dots") return generateDotPattern(dimension.width, dimension.height);
    if (bgPattern === "lines") return generateLinePattern(dimension.width, dimension.height);
    return null;
  }, [mode, bgPattern, dimension]);

  const handleMeasure = useCallback((s: Size) => {
    setGroupSize((p) => (p.w === s.w && p.h === s.h ? p : s));
  }, []);

  // Dedupe wie beim Claim — sonst Endlosschleife (setState im Layout-Effekt).
  const handleIlluMeasure = useCallback((s: Size) => {
    setIlluSize((p) => (p.w === s.w && p.h === s.h ? p : s));
  }, []);
  const handlePersonMeasure = useCallback((s: Size) => {
    setPersonSize((p) => (p.w === s.w && p.h === s.h ? p : s));
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
          bgPattern={bgPattern}
          hasPerson={person != null}
          personScale={person?.scale ?? null}
          personLook={personLook}
          frameColor={frameColor}
          frameThickness={frameThickness}
          frameRough={frameRough}
          imgStrength={imgStrength}
          grade={grade}
          uploadError={uploadError}
          onMode={setMode}
          onBgPattern={setBgPattern}
          onClaim={patchClaim}
          onDimension={setDimensionKey}
          onFile={handleFile}
          onClearBackground={() => setImage(null)}
          onClearIllu={() => setIllu(null)}
          onClearPerson={() => setPerson(null)}
          onIlluScale={(v) => setIllu((i) => (i ? { ...i, scale: v } : i))}
          onPersonScale={(v) => setPerson((i) => (i ? { ...i, scale: v } : i))}
          onPersonLook={setPersonLook}
          onFrameColor={setFrameColor}
          onFrameThickness={setFrameThickness}
          onFrameRough={setFrameRough}
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
          accept={(mode === "photo" ? ACCEPTED_TYPES : mode === "illustration" ? ILLU_TYPES : PERSON_TYPES).join(",")}
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Stage
          ref={stageRef}
          dimension={dimension}
          showSafeZone={!exporting}
          warnSafeZone={warnSafeZone}
          background={
            mode !== "photo" ? (
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
          {mode === "person" && person && personSrc && (
            <PersonLayer
              src={personSrc}
              lookFilter={personLook === "bwriver" ? BWRIVER_FILTER : ""}
              frameColor={FRAME_HEX[frameColor]}
              thickness={frameThickness}
              rough={frameRough}
              x={person.x}
              y={person.y}
              scale={person.scale}
              dimension={dimension}
              stageRef={stageRef}
              onDrag={onPersonDrag}
              onMeasure={handlePersonMeasure}
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
              {mode === "photo" ? "Foto hinzufügen" : mode === "illustration" ? "Illustration hinzufügen" : "Person-PNG hinzufügen"}
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
