import type {
  CarouselDoc, Slide, SurfaceTone, StickerColor, ImageMode, TextureMode, LogoPos, TexLevels,
} from "./model";
import { LAYOUTS, MAX_SLIDES, makeSlide, GRADIENTS, TEXTURES, STICKER_COLORS, defaultDoc } from "./model";

// Entwurf-Persistenz für das Karussell (Text/Layout/Thema; OHNE Bilder).

const KEY = "freshpost.carousel.v4";

const SURFACES = ["deep", "mid", "soft"] as const;
const IMAGE_MODES = ["normal", "duotone"] as const;
const GRADIENT_KEYS = GRADIENTS.map((g) => g.key);

function obj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function bool(v: unknown, def: boolean): boolean {
  return typeof v === "boolean" ? v : def;
}
function inSet<T extends string>(v: unknown, set: readonly T[], def: T): T {
  return typeof v === "string" && (set as readonly string[]).includes(v) ? (v as T) : def;
}
function clamp(v: unknown, lo: number, hi: number, def: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
}
function toTex(v: unknown, def: TexLevels): TexLevels {
  const o = obj(v);
  const r = {} as TexLevels;
  for (const m of TEXTURES as readonly TextureMode[]) r[m] = clamp(o[m], 0, 100, def[m]);
  return r;
}

function toSlide(raw: unknown): Slide {
  const s = obj(raw);
  const layout = inSet(s.layout, LAYOUTS, "typo");
  const base = makeSlide(layout);
  return {
    ...base,
    kicker: str(s.kicker),
    kickerColor: inSet<StickerColor>(s.kickerColor, STICKER_COLORS, "rose"),
    kickerSticker: bool(s.kickerSticker, false),
    heading: str(s.heading),
    headingColor: inSet<StickerColor>(s.headingColor, STICKER_COLORS, "white"),
    headingSticker: bool(s.headingSticker, false),
    tilt: clamp(s.tilt, -12, 12, base.tilt),
    body: str(s.body),
    attribution: str(s.attribution),
    surface: inSet<SurfaceTone>(s.surface, SURFACES, "mid"),
    imageMode: inSet<ImageMode>(s.imageMode, IMAGE_MODES, base.imageMode),
    imageRough: bool(s.imageRough, false),
    imgOffX: clamp(s.imgOffX, -0.5, 0.5, 0),
    imgOffY: clamp(s.imgOffY, -0.5, 0.5, 0),
    images: [], // nicht persistiert
  };
}

export function loadDoc(): CarouselDoc {
  const def = defaultDoc();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return def;
    const d = obj(JSON.parse(raw));
    const arr = Array.isArray(d.slides) ? d.slides : [];
    const slides = arr.slice(0, MAX_SLIDES).map(toSlide);
    if (slides.length === 0) return def;
    return {
      slides,
      gradient: inSet(d.gradient, GRADIENT_KEYS, "night"),
      texBack: toTex(d.texBack, def.texBack),
      texFront: toTex(d.texFront, def.texFront),
      logo: str(d.logo) || null,
      logoPos: inSet<LogoPos>(d.logoPos, ["top", "bottom"], "bottom"),
      dimensionKey: str(d.dimensionKey) || "post",
      swipeBottom: bool(d.swipeBottom, false),
    };
  } catch {
    return def;
  }
}

export function saveDoc(doc: CarouselDoc): void {
  try {
    const slim: CarouselDoc = { ...doc, slides: doc.slides.map((s) => ({ ...s, images: [] })) };
    localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    /* Speicher voll / privater Modus → still überspringen. */
  }
}
