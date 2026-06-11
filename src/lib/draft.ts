import type { Claim, Mode, BgPattern } from "./types";
import { LOGO_CORNERS, LOGO_SIZES, type LogoState } from "./logos";

// Entwurf-Persistenz: Claim/Mode/Format überleben Reload & Tab-Tod (mobil
// häufig). Bewusst ohne Bilddaten — nur der leichte Text-/Einstellungs-State.

const KEY = "freshpost.draft.v1";

export type Draft = {
  claim: Claim;
  mode: Mode;
  bgPattern: BgPattern;
  dimensionKey: string;
  advanced: boolean;
  logo: LogoState;
};

const MODES: Mode[] = ["photo", "illustration", "person"];
const PATTERNS: BgPattern[] = ["paper", "dots", "lines", "none"];

function isLogoState(v: unknown): v is LogoState {
  if (typeof v !== "object" || v == null) return false;
  const l = v as LogoState;
  return (
    (l.key === null || typeof l.key === "string") &&
    LOGO_CORNERS.includes(l.corner) &&
    LOGO_SIZES.includes(l.size)
  );
}

export function loadDraft(): Partial<Draft> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    if (typeof d !== "object" || d == null) return null;
    return {
      claim: typeof d.claim === "object" && d.claim != null ? d.claim : undefined,
      mode: MODES.includes(d.mode as Mode) ? d.mode : undefined,
      bgPattern: PATTERNS.includes(d.bgPattern as BgPattern) ? d.bgPattern : undefined,
      dimensionKey: typeof d.dimensionKey === "string" ? d.dimensionKey : undefined,
      advanced: typeof d.advanced === "boolean" ? d.advanced : undefined,
      logo: isLogoState(d.logo) ? d.logo : undefined,
    };
  } catch {
    return null;
  }
}

export function saveDraft(d: Draft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // Speicher voll / privater Modus → Persistenz still überspringen.
  }
}
