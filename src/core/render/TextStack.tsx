import type { CSSProperties } from "react";
import type { Brand, Surface, TextRole } from "../../brand/contract";
import type { Frame } from "../doc/composition";
import { parseMarkers } from "../text/markers";

// Setzt die Rollen eines Layouts untereinander. Der Kern weiss nicht, was eine
// "Schlagzeile" ist — er liest die Rolle aus dem Marken-Paket und wendet an,
// was dort steht.

type Props = {
  frame: Frame;
  brand: Brand;
  surface: Surface;
  slots: string[];
  width: number; // Formatbreite in Export-Pixeln
};

const fs = (width: number, fraction: number) => Math.round(width * fraction);

function roleStyle(role: TextRole, brand: Brand, surface: Surface, width: number): CSSProperties {
  return {
    fontFamily: role.font === "display" ? brand.type.display : brand.type.body,
    fontWeight: role.weight,
    fontStyle: role.italic ? "italic" : undefined,
    fontSize: fs(width, role.size),
    lineHeight: role.lineHeight,
    letterSpacing: role.tracking ? `${role.tracking}em` : undefined,
    textTransform: role.upper ? "uppercase" : undefined,
    color: surface.ink,
    marginBottom: fs(width, role.gapAfter),
    whiteSpace: "pre-wrap",
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

export function TextStack({ frame, brand, surface, slots, width }: Props) {
  const visible = slots.filter((key) => (frame.text[key] ?? "").trim().length > 0);
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((key, i) => {
        const role = brand.roles[key];
        if (!role) return null;
        const last = i === visible.length - 1;
        const style = roleStyle(role, brand, surface, width);
        if (last) style.marginBottom = 0;
        const content = frame.text[key];
        return (
          <div key={key} className="fp-role" style={style}>
            {role.prefix}
            {renderRuns(content, role, brand)}
            {role.ruleAfter && (
              <span
                className="fp-role-rule"
                style={{
                  display: "block",
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
