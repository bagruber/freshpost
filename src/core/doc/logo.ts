// Logo-Platzierung. Bewusst eingeschraenkt: unten in der Safety-Zone
// (links/mittig/rechts), zwei Groessenstufen, nicht frei verschiebbar. Die
// Beschraenkung ist Absicht — das Werkzeug soll das CD durchsetzen. Welche
// Logos es gibt und wie breit die Stufen sind, sagt die Marke.

export type LogoCorner = "bl" | "bc" | "br";
export type LogoSize = "s" | "m";

export const LOGO_CORNERS: LogoCorner[] = ["bl", "bc", "br"];
export const LOGO_SIZES: LogoSize[] = ["s", "m"];

export type LogoState = { key: string | null; corner: LogoCorner; size: LogoSize };

export const DEFAULT_LOGO: LogoState = { key: null, corner: "br", size: "s" };
