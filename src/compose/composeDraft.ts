import type { Brand } from "../brand/contract";
import { getLayout, getSurface } from "../brand/contract";
import { obj, str, num, inSet, readStore, writeStore } from "../core/doc/validate";
import { MAX_FRAMES, frameId, pruneText, type Composition, type Frame, type MediaItem } from "../core/doc/composition";

// Entwurf-Persistenz fuer die Composition. Wie ueberall OHNE Bilddaten —
// Data-URLs sprengen den localStorage.
//
// Der Schluessel traegt die Marken-Id: zwei Marken haben verschiedene Layouts
// und Rollen, ihre Entwuerfe duerfen sich nicht gegenseitig ueberschreiben.

const key = (brand: Brand) => `compose.${brand.id}.v1`;

function emptyFrame(brand: Brand): Frame {
  return {
    id: frameId(),
    layoutId: brand.layouts[0].key,
    surfaceKey: brand.surfaces[0].key,
    text: {},
    media: [],
  };
}

export function emptyComposition(brand: Brand): Composition {
  return { brandId: brand.id, formatKey: brand.formats[0].key, frames: [emptyFrame(brand)] };
}

function toFrame(raw: unknown, brand: Brand): Frame {
  const f = obj(raw);
  const base = emptyFrame(brand);
  const layoutId = inSet(f.layoutId, brand.layouts.map((l) => l.key), base.layoutId);
  const layout = getLayout(brand, layoutId);

  // Nur Rollen uebernehmen, die dieses Layout kennt — ein Entwurf kann aus
  // einer aelteren Version oder einer anderen Marke stammen.
  const rawText = obj(f.text);
  const text: Record<string, string> = {};
  for (const slot of layout.slots) if (brand.roles[slot]) text[slot] = str(rawText[slot]);

  const media: MediaItem[] = [];
  const rawMedia = Array.isArray(f.media) ? f.media : [];
  for (const m of rawMedia.slice(0, Math.max(0, layout.media))) {
    const o = obj(m);
    media.push({
      url: "", // nicht persistiert
      name: str(o.name),
      kind: inSet(o.kind, ["photo", "illustration"] as const, "photo"),
      credit: str(o.credit),
      offX: num(o.offX, -1, 1, 0),
      offY: num(o.offY, -1, 1, 0),
      scale: num(o.scale, 0.2, 4, 1),
    });
  }

  return {
    ...base,
    layoutId,
    surfaceKey: getSurface(brand, str(f.surfaceKey)).key,
    text: pruneText(text, layout.slots),
    // Ohne url ist ein Bild nutzlos — es bleibt der Platzhalter fuer den
    // Nachweis, aber gerendert wird nichts.
    media: media.filter((m) => m.url !== "" || m.credit !== ""),
  };
}

export function loadComposition(brand: Brand): Composition {
  const def = emptyComposition(brand);
  return readStore<Composition>(key(brand), (raw) => {
    const d = obj(raw);
    const arr = Array.isArray(d.frames) ? d.frames : [];
    const frames = arr.slice(0, MAX_FRAMES).map((f) => toFrame(f, brand));
    if (frames.length === 0) return def;
    return {
      brandId: brand.id,
      formatKey: inSet(d.formatKey, brand.formats.map((f) => f.key), def.formatKey),
      frames,
    };
  }, def);
}

export function saveComposition(doc: Composition): void {
  writeStore(`compose.${doc.brandId}.v1`, {
    ...doc,
    frames: doc.frames.map((f) => ({ ...f, media: f.media.map((m) => ({ ...m, url: "" })) })),
  });
}
