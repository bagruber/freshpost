// Logo-Platzierung. Bewusst eingeschraenkt: in der Safety-Zone, zwei
// Groessenstufen, nicht frei verschiebbar. Die Beschraenkung ist Absicht — das
// Werkzeug soll das CD durchsetzen. Welche Logos es gibt und wie breit die
// Stufen sind, sagt die Marke.
//
// "tc" (oben mittig) gibt es, weil bei einem mehrteiligen Beitrag die
// Fortschrittsanzeige unten stehen kann und das Logo ihr ausweichen muss.

export type LogoCorner = "tc" | "bl" | "bc" | "br";
export type LogoSize = "s" | "m";

export const LOGO_CORNERS: LogoCorner[] = ["tc", "bl", "bc", "br"];
export const LOGO_SIZES: LogoSize[] = ["s", "m"];

export type LogoState = { key: string | null; corner: LogoCorner; size: LogoSize };

export const DEFAULT_LOGO: LogoState = { key: null, corner: "br", size: "s" };
