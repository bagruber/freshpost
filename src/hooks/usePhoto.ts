import { useMemo, useState } from "react";
import { useBackgroundImage } from "./useBackgroundImage";
import type { Dimension } from "../lib/dimensions";
import { loadBackgroundImage } from "../lib/image";
import { GRADE_BASE, scaleGrade, type Grade } from "../lib/ciFilter";
import { DEFAULTS } from "../lib/config";

// Kompletter Foto-Modus-Zustand: Grade-Regler (Standard: ein CI-Look-Regler,
// Advanced: Einzelregler) plus die Bild-Pipeline aus useBackgroundImage.

export function usePhoto(advanced: boolean, dimension: Dimension) {
  const [imgStrength, setImgStrength] = useState(DEFAULTS.imgStrength); // Standard: ein CI-Look-Regler
  const [gradeAdv, setGradeAdv] = useState<Grade>(() => scaleGrade(GRADE_BASE, DEFAULTS.gradeFactor));

  // Effektiver Grade: Advanced nutzt die Einzelregler, Standard skaliert den
  // empfohlenen Look mit dem einen CI-Look-Regler.
  const grade = useMemo<Grade>(
    () => (advanced ? gradeAdv : scaleGrade(GRADE_BASE, imgStrength / 100)),
    [advanced, gradeAdv, imgStrength],
  );

  const bg = useBackgroundImage(grade, dimension);

  // Wirft ImageError-Keys (siehe IMAGE_ERROR_TEXT) — Mapping macht der Aufrufer.
  const load = async (file: File) => {
    bg.setImage(await loadBackgroundImage(file));
  };

  return {
    ...bg,
    grade,
    imgStrength,
    setImgStrength,
    setGrade: (key: keyof Grade, v: number) => setGradeAdv((g) => ({ ...g, [key]: v })),
    // Beim Wechsel in Advanced die Einzelregler vom Standard-Look übernehmen.
    adoptStandardLook: () => setGradeAdv(scaleGrade(GRADE_BASE, imgStrength / 100)),
    load,
    clear: () => bg.setImage(null),
  };
}

export type PhotoState = ReturnType<typeof usePhoto>;
