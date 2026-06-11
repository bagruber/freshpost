import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "./components/Stage";
import { ClaimGroup } from "./components/ClaimGroup";
import { CanvasBackground } from "./components/CanvasBackground";
import { IllustrationLayer } from "./components/IllustrationLayer";
import { PersonLayer } from "./components/PersonLayer";
import { Controls } from "./components/Controls";
import { BottomSheet } from "./components/BottomSheet";
import { usePhoto } from "./hooks/usePhoto";
import { usePerson } from "./hooks/usePerson";
import { useIllustration } from "./hooks/useIllustration";
import { DEFAULT_DIMENSION, getDimension } from "./lib/dimensions";
import { autoMainSize } from "./lib/layout";
import { extents, clampToCanvas, violatesSafe, type Size, type Pos } from "./lib/geometry";
import { exportStageToJpg } from "./lib/exportImage";
import { IMAGE_ERROR_TEXT, ACCEPTED_TYPES } from "./lib/image";
import { ILLU_ERROR_TEXT, ILLU_TYPES } from "./lib/illustration";
import { PERSON_TYPES, PERSON_ERROR_TEXT } from "./lib/personImage";
import { SEC_MAX, secondaryStyle, type Claim, type Mode, type BgPattern } from "./lib/types";
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [bgPattern, setBgPattern] = useState<BgPattern>("paper");
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

  const photo = usePhoto(advanced, dimension);
  const person = usePerson(dimension);
  const illu = useIllustration(dimension);

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
      photo.adoptStandardLook();
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
        await photo.load(file);
      } else if (mode === "illustration") {
        await illu.load(file);
      } else {
        await person.load(file);
      }
      setUploadError(null);
    } catch (e) {
      const table =
        mode === "photo" ? IMAGE_ERROR_TEXT : mode === "illustration" ? ILLU_ERROR_TEXT : PERSON_ERROR_TEXT;
      setUploadError(table[e as keyof typeof table] ?? "Fehler");
    }
  };

  const hasContent =
    mode === "photo" ? photo.hasBackground : mode === "illustration" ? illu.item != null : person.item != null;

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
      const restore = await photo.swapFullForExport();
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
          bgPattern={bgPattern}
          uploadError={uploadError}
          photo={photo}
          illu={illu}
          person={person}
          onMode={setMode}
          onBgPattern={setBgPattern}
          onClaim={patchClaim}
          onDimension={setDimensionKey}
          onFile={handleFile}
          onAdvanced={onAdvanced}
          onReroll={onReroll}
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
            <CanvasBackground
              mode={mode}
              bgPattern={bgPattern}
              dimension={dimension}
              photo={photo}
              stageRef={stageRef}
            />
          }
        >
          {mode === "illustration" && illu.item && illu.displaySrc && (
            <IllustrationLayer
              src={illu.displaySrc}
              x={illu.item.x}
              y={illu.item.y}
              scale={illu.item.scale}
              dimension={dimension}
              stageRef={stageRef}
              onDrag={illu.onDrag}
              onMeasure={illu.onMeasure}
            />
          )}
          {mode === "person" && person.item && person.displaySrc && (
            <PersonLayer
              src={person.displaySrc}
              lookFilter={person.lookFilter}
              frameColor={person.frameHex}
              thickness={person.frameThickness}
              rough={person.frameRough}
              x={person.item.x}
              y={person.item.y}
              scale={person.item.scale}
              dimension={dimension}
              stageRef={stageRef}
              onDrag={person.onDrag}
              onMeasure={person.onMeasure}
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
