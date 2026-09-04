import type { Brand, Layout } from "../brand/contract";
import { getLayout, getSurface } from "../brand/contract";
import { obj, str, bool, num, inSet, readStore, writeStore } from "../core/doc/validate";
import { LOGO_CORNERS, LOGO_SIZES } from "../core/doc/logo";
import { TEXTURES } from "../core/render/useGroundLayers";
import {
  MAX_FRAMES, frameId, noTexture, pruneText,
  type Composition, type Frame, type MediaItem, type RoleStyle, type TextureLevels,
} from "../core/doc/composition";
import { migrateCarousel } from "./migrateCarousel";

// Entwurf-Persistenz fuer die Composition. Wie ueberall OHNE Bilddaten —
// Data-URLs sprengen den localStorage.
//
// Der Schluessel traegt die Marken-Id: zwei Marken haben verschiedene Layouts
// und Rollen, ihre Entwuerfe duerfen sich nicht gegenseitig ueberschreiben.

const key = (brand: Brand) => `compose.${brand.id}.v2`;

const randomTilt = () => Math.round((Math.random() * 2 - 1) * 5 * 10) / 10; // ±5°

// Ein frei gesetztes Cutout ohne seine Kante sieht aus wie ein Fehler; ein
// Foto in der Restflaeche nicht. Deshalb ist die Kante dort der Vorgabewert
// und hier nur eine Option.
export const defaultRough = (layout: Layout) => layout.media.place === "float" && !!layout.media.frame;

export function emptyFrame(brand: Brand, layoutId = brand.layouts[0].key): Frame {
  const layout = getLayout(brand, layoutId);
  return {
    id: frameId(),
    layoutId,
    surfaceKey: brand.surfaces[0].key,
    text: {},
    roleStyle: {},
    tilt: randomTilt(),
    media: [],
    mediaOffX: 0,
    mediaOffY: 0,
    tone: !!layout.media.tone,
    roughFrame: defaultRough(layout),
  };
}

export function emptyComposition(brand: Brand): Composition {
  return {
    brandId: brand.id,
    formatKey: brand.formats[0].key,
    groundKey: null,
    texBack: noTexture(),
    texFront: noTexture(),
    progress: "none",
    logoKey: null,
    logoCorner: "br",
    logoSize: "s",
    frames: [emptyFrame(brand)],
  };
}

function toTexture(raw: unknown): TextureLevels {
  const o = obj(raw);
  const out: TextureLevels = {};
  for (const m of TEXTURES) out[m] = num(o[m], 0, 100, 0);
  return out;
}

function toRoleStyle(raw: unknown, brand: Brand, slots: string[]): Record<string, RoleStyle> {
  const o = obj(raw);
  const out: Record<string, RoleStyle> = {};
  const paletteKeys = brand.colors ? brand.colors.order : [];
  for (const slot of slots) {
    const role = brand.roles[slot];
    const v = obj(o[slot]);
    if (!role) continue;
    const style: RoleStyle = {};
    if (role.tint && paletteKeys.length > 0) style.colorKey = inSet(v.colorKey, paletteKeys, paletteKeys[0]);
    if (role.sticker) style.sticker = bool(v.sticker, false);
    if (style.colorKey !== undefined || style.sticker !== undefined) out[slot] = style;
  }
  return out;
}

export function toFrame(raw: unknown, brand: Brand): Frame {
  const f = obj(raw);
  const layoutId = inSet(f.layoutId, brand.layouts.map((l) => l.key), brand.layouts[0].key);
  const base = emptyFrame(brand, layoutId);
  const layout = getLayout(brand, layoutId);

  // Nur Rollen uebernehmen, die dieses Layout kennt — ein Entwurf kann aus
  // einer aelteren Version oder einer anderen Marke stammen.
  const rawText = obj(f.text);
  const text: Record<string, string> = {};
  for (const slot of layout.slots) if (brand.roles[slot]) text[slot] = str(rawText[slot]);

  const media: MediaItem[] = [];
  const rawMedia = Array.isArray(f.media) ? f.media : [];
  for (const m of rawMedia.slice(0, Math.max(0, layout.media.count))) {
    const o = obj(m);
    media.push({
      url: "", // nicht persistiert
      name: str(o.name),
      kind: inSet(o.kind, ["photo", "illustration"] as const, "photo"),
      credit: str(o.credit),
      scale: num(o.scale, 0.2, 4, 1),
    });
  }

  return {
    ...base,
    layoutId,
    surfaceKey: getSurface(brand, str(f.surfaceKey)).key,
    text: pruneText(text, layout.slots),
    roleStyle: toRoleStyle(f.roleStyle, brand, layout.slots),
    tilt: num(f.tilt, -12, 12, base.tilt),
    mediaOffX: num(f.mediaOffX, -0.5, 0.5, 0),
    mediaOffY: num(f.mediaOffY, -0.5, 0.5, 0),
    tone: bool(f.tone, base.tone),
    roughFrame: bool(f.roughFrame, base.roughFrame),
    // Ohne url ist ein Bild nutzlos — es bleibt der Platzhalter fuer den
    // Nachweis, aber gerendert wird nichts.
    media: media.filter((m) => m.credit !== ""),
  };
}

function parse(raw: unknown, brand: Brand): Composition {
  const def = emptyComposition(brand);
  const d = obj(raw);
  const arr = Array.isArray(d.frames) ? d.frames : [];
  const frames = arr.slice(0, MAX_FRAMES).map((f) => toFrame(f, brand));
  if (frames.length === 0) return def;
  return {
    brandId: brand.id,
    formatKey: inSet(d.formatKey, brand.formats.map((f) => f.key), def.formatKey),
    groundKey: brand.surfaces.some((s) => s.key === d.groundKey) ? str(d.groundKey) : null,
    texBack: toTexture(d.texBack),
    texFront: toTexture(d.texFront),
    progress: inSet(d.progress, ["none", "top", "bottom"] as const, "none"),
    logoKey: brand.logo.options.some((o) => o.key === d.logoKey) ? str(d.logoKey) : null,
    logoCorner: inSet(d.logoCorner, LOGO_CORNERS, def.logoCorner),
    logoSize: inSet(d.logoSize, LOGO_SIZES, def.logoSize),
    frames,
  };
}

export function loadComposition(brand: Brand): Composition {
  const stored = readStore<Composition | null>(key(brand), (raw) => parse(raw, brand), null);
  if (stored) return stored;
  // Kein Composition-Entwurf: vielleicht liegt noch einer aus dem
  // Langtext-Werkzeug herum. Der wird einmalig uebernommen.
  return migrateCarousel(brand, (raw) => parse(raw, brand)) ?? emptyComposition(brand);
}

export function saveComposition(doc: Composition): void {
  writeStore(`compose.${doc.brandId}.v2`, {
    ...doc,
    frames: doc.frames.map((f) => ({ ...f, media: f.media.map((m) => ({ ...m, url: "" })) })),
  });
}
