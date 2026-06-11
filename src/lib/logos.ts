// Logo-Varianten aus src/assets/logos/*.svg (Build-Zeit-Glob). Leerer Ordner
// → leere Liste → Logo-UI bleibt ausgeblendet. Logos werden unverändert
// gerendert; CI-konforme Farben müssen im SVG stecken.

const files = import.meta.glob("../assets/logos/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export type LogoOption = { key: string; label: string; url: string };

export const LOGOS: LogoOption[] = Object.entries(files)
  .map(([path, url]) => {
    const key = path.split("/").pop()!.replace(/\.svg$/i, "");
    return { key, label: key.replace(/[-_]+/g, " "), url };
  })
  .sort((a, b) => a.label.localeCompare(b.label, "de"));

export function getLogo(key: string | null): LogoOption | null {
  return key ? LOGOS.find((l) => l.key === key) ?? null : null;
}

export type LogoCorner = "bl" | "bc" | "br";
export type LogoSize = "s" | "m";

// Platzierung bewusst eingeschränkt (CI-Wächter): unten in der Safety-Zone
// (links/mittig/rechts), zwei seriöse Größen, nicht frei verschiebbar.
export type LogoState = { key: string | null; corner: LogoCorner; size: LogoSize };

export const LOGO_CORNERS: LogoCorner[] = ["bl", "bc", "br"];
export const LOGO_SIZES: LogoSize[] = ["s", "m"];
export const DEFAULT_LOGO: LogoState = { key: null, corner: "br", size: "s" };
