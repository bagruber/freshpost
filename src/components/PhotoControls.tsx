import type { PhotoState } from "../hooks/usePhoto";
import type { Grade } from "../core/color/grade";
import { Slider } from "../core/input/controls";

// Foto-spezifische Controls: Standard = ein CI-Look-Regler,
// Advanced = Bildlook-Einzelregler (Grade-Block).

const GRADE_FIELDS: { key: keyof Grade; label: string }[] = [
  { key: "cv", label: "Kontrast" },
  { key: "wm", label: "Wärme" },
  { key: "ro", label: "Rose" },
  { key: "wi", label: "Wind" },
  { key: "rv", label: "River" },
  { key: "bd", label: "Blau" },
];

export function PhotoControls({ photo, advanced }: { photo: PhotoState; advanced: boolean }) {
  if (!photo.hasBackground || advanced) return null;
  return (
    <Slider label={`CI-Look ${photo.imgStrength}`} value={photo.imgStrength} min={0} max={100} step={1}
      onChange={photo.setImgStrength} />
  );
}

export function PhotoAdvancedControls({ photo }: { photo: PhotoState }) {
  if (!photo.hasBackground) return null;
  return (
    <div className="grade-block">
      <p className="grade-title">Bildlook</p>
      {GRADE_FIELDS.map((f) => (
        <Slider key={f.key} label={`${f.label} ${Math.round(photo.grade[f.key] * 100)}`}
          value={Math.round(photo.grade[f.key] * 100)} min={0} max={100} step={1}
          onChange={(v) => photo.setGrade(f.key, v / 100)} />
      ))}
    </div>
  );
}
