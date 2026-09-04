import type { Claim, Mode, BgPattern } from "./claim";
import { LOGO_CORNERS, LOGO_SIZES, type LogoState } from "./logo";
import { readStore, writeStore } from "./validate";

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

// Felder einzeln geprüft; `undefined` heißt „nimm den Startwert". Der Claim
// wird nur als Objekt geprüft und über die Defaults gelegt — die Einzelfelder
// prüft er beim Rendern selbst.
export function loadDraft(): Partial<Draft> | null {
  return readStore<Partial<Draft> | null>(KEY, (raw) => {
    const d = raw as Partial<Draft>;
    if (typeof d !== "object" || d == null) return null;
    return {
      claim: typeof d.claim === "object" && d.claim != null ? d.claim : undefined,
      mode: MODES.includes(d.mode as Mode) ? d.mode : undefined,
      bgPattern: PATTERNS.includes(d.bgPattern as BgPattern) ? d.bgPattern : undefined,
      dimensionKey: typeof d.dimensionKey === "string" ? d.dimensionKey : undefined,
      advanced: typeof d.advanced === "boolean" ? d.advanced : undefined,
      logo: isLogoState(d.logo) ? d.logo : undefined,
    };
  }, null);
}

export function saveDraft(d: Draft): void {
  writeStore(KEY, d);
}
