import type { CSSProperties, Ref } from "react";
import type { Brand, Layout, Surface, TextRole } from "../../brand/contract";
import type { Frame, RoleStyle } from "../doc/composition";
import { parseMarkers } from "../text/markers";

// Setzt die Rollen eines Layouts untereinander. Der Kern weiss nicht, was eine
// "Schlagzeile" ist — er liest die Rolle aus dem Marken-Paket und wendet an,
// was dort steht.
//
// Zwei Dinge darf der Frame je Rolle variieren, und nur, wenn die Rolle es
// freigibt: eine Farbe aus der Palette (`tint`) und die Setzung als gekippte
// Farbbox (`sticker`). Aufeinanderfolgende Sticker werden als EINE Gruppe
// gekippt — einzeln gekippt haengt ihr Abstand an der Neigung.

type Props = {
  frame: Frame;
  brand: Brand;
  surface: Surface;
  layout: Layout;
  width: number; // Formatbreite in Export-Pixeln
  // Mindesthoehe des Kopfes, ueber alle Frames desselben Layouts gemessen.
  headMin?: number;
  headRef?: Ref<HTMLDivElement>;
  headOnly?: boolean; // nur den Kopf setzen (zum Vermessen, siehe HeadMeasurer)
};

const fs = (width: number, fraction: number) => Math.round(width * fraction);

// Was die Rolle in DIESEM Frame traegt. Ohne Farb-Faehigkeit oder ohne
// Freigabe durch die Rolle bleibt es bei der Schriftfarbe der Flaeche.
function paint(role: TextRole, style: RoleStyle | undefined, brand: Brand, surface: Surface) {
  const asSticker = !!role.sticker && !!style?.sticker;
  const colors = brand.colors;
  if (!colors || !role.tint) return { asSticker: false, color: surface.ink, background: undefined };
  const key = style?.colorKey && style.colorKey in colors.palette ? style.colorKey : colors.order[0];
  const entry = colors.palette[key];
  return asSticker
    ? { asSticker: true, color: entry.on, background: entry.bg }
    : { asSticker: false, color: entry.flush, background: undefined };
}

function roleStyle(role: TextRole, brand: Brand, width: number): CSSProperties {
  return {
    fontFamily: role.font === "display" ? brand.type.display : brand.type.body,
    fontWeight: role.weight,
    fontStyle: role.italic ? "italic" : undefined,
    fontSize: fs(width, role.size),
    lineHeight: role.lineHeight,
    letterSpacing: role.tracking ? `${role.tracking}em` : undefined,
    textTransform: role.upper ? "uppercase" : undefined,
    whiteSpace: role.nowrap ? "nowrap" : "pre-wrap",
  };
}

// Inline-Auszeichnung: *wort* ~wort~ _wort_ → Slot 0/1/2. Welche Wirkung ein
// Slot hat, sagt die Rolle — bei SZ ein Schriftwechsel, bei fresh eine farbige
// Box. Ohne `emphasis` bleiben die Marker sichtbarer Text, damit niemand
// stillschweigend Zeichen verliert.
function renderRuns(text: string, role: TextRole, brand: Brand) {
  if (!role.emphasis || role.emphasis.length === 0) return text;
  const paras = parseMarkers(text);
  return paras.map((runs, i) => (
    <p key={i} style={{ margin: i === 0 ? 0 : `${role.lineHeight * 0.55}em 0 0` }}>
      {runs.map((r, j) => {
        if (r.slot == null) return <span key={j}>{r.text}</span>;
        const em = role.emphasis![r.slot % role.emphasis!.length];
        return (
          <span
            key={j}
            style={{
              fontFamily: em.font ? (em.font === "display" ? brand.type.display : brand.type.body) : undefined,
              fontWeight: em.weight,
              background: em.background,
              color: em.color,
              // Farbige Box braucht Luft, ein Schriftwechsel nicht.
              padding: em.background ? "0.02em 0.16em" : undefined,
              boxDecorationBreak: em.background ? "clone" : undefined,
              WebkitBoxDecorationBreak: em.background ? "clone" : undefined,
            }}
          >
            {r.text}
          </span>
        );
      })}
    </p>
  ));
}

type Piece = { key: string; role: TextRole; text: string; sticker: boolean; color: string; background?: string };

// Aufeinanderfolgende Sticker zu Gruppen buendeln; alles andere steht allein.
function group(pieces: Piece[]): Piece[][] {
  const out: Piece[][] = [];
  for (const p of pieces) {
    const last = out[out.length - 1];
    if (p.sticker && last && last[0].sticker) last.push(p);
    else out.push([p]);
  }
  return out;
}

function Block({ pieces, brand, surface, width, tilt }: {
  pieces: Piece[];
  brand: Brand;
  surface: Surface;
  width: number;
  tilt: number;
}) {
  return (
    <>
      {group(pieces).map((members) => {
        const last = members[members.length - 1];
        const gap = fs(width, last.role.gapAfter);

        if (members[0].sticker) {
          return (
            <div
              key={members[0].key}
              className="fp-stack"
              style={{ transform: `rotate(${tilt}deg)`, marginBottom: gap }}
            >
              {members.map((p, i) => {
                const st = p.role.sticker!;
                const size = fs(width, p.role.size);
                return (
                  <span
                    key={p.key}
                    className="fp-sticker"
                    style={{
                      ...roleStyle(p.role, brand, width),
                      color: p.color,
                      background: p.background,
                      padding: `${st.padY}em ${st.padX}em`,
                      boxShadow: st.shadow,
                      marginTop: i === 0 ? 0 : -size * st.overlap,
                      zIndex: members.length - i,
                    }}
                  >
                    {p.role.prefix}
                    {p.text}
                  </span>
                );
              })}
            </div>
          );
        }

        const p = members[0];
        return (
          <div
            key={p.key}
            className="fp-role"
            style={{ ...roleStyle(p.role, brand, width), color: p.color, marginBottom: gap }}
          >
            {p.role.prefix}
            {renderRuns(p.text, p.role, brand)}
            {p.role.ruleAfter && (
              <span
                className="fp-role-rule"
                style={{
                  width: fs(width, 0.105),
                  height: Math.max(2, fs(width, 0.005)),
                  background: surface.ink,
                  marginTop: fs(width, 0.045),
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function TextStack({ frame, brand, surface, layout, width, headMin, headRef, headOnly }: Props) {
  const pieces = layout.slots
    .filter((key) => brand.roles[key] && (frame.text[key] ?? "").trim().length > 0)
    .map((key) => {
      const role = brand.roles[key];
      const { asSticker, color, background } = paint(role, frame.roleStyle[key], brand, surface);
      return { key, role, text: frame.text[key], sticker: asSticker, color, background };
    });

  // Der Kopf sind die ersten n Rollen des Layouts (nicht der belegten): so
  // beginnen die Absaetze ueber alle Frames desselben Layouts gleich hoch.
  const headKeys = new Set(layout.slots.slice(0, layout.headSlots ?? 0));
  const head = pieces.filter((p) => headKeys.has(p.key));
  const rest = pieces.filter((p) => !headKeys.has(p.key));
  const common = { brand, surface, width, tilt: frame.tilt };

  if (headOnly) {
    return (
      <div className="fp-head" ref={headRef}>
        <Block pieces={head} {...common} />
      </div>
    );
  }
  if (headKeys.size === 0) return <Block pieces={rest} {...common} />;

  return (
    <>
      <div className="fp-head" ref={headRef} style={{ minHeight: headMin }}>
        <Block pieces={head} {...common} />
      </div>
      <Block pieces={rest} {...common} />
    </>
  );
}
