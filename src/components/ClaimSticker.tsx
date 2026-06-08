import type { Claim } from "../lib/types";
import type { Dimension } from "../lib/dimensions";
import { useDrag } from "../hooks/useDrag";

// Der Claim-Sticker: schräge Box (oder reiner Text) mit Barlow Condensed.
// Position als Bruchteil der Stage, Schriftgröße relativ zur Stage-Breite,
// damit alles unabhängig von der Vorschau-Skalierung exakt exportiert.

type Props = {
  claim: Claim;
  dimension: Dimension;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onChange: (patch: Partial<Claim>) => void;
};

const STYLE_BG: Record<Claim["style"], string> = {
  rose: "var(--fresh-rose)",
  wind: "var(--fresh-wind)",
  white: "var(--color-bg-sticker)",
  text: "transparent",
};

const STYLE_FG: Record<Claim["style"], string> = {
  rose: "var(--color-text-on-rose)",
  wind: "var(--color-text-on-wind)",
  white: "var(--color-text-on-sticker)",
  text: "var(--color-text-primary)",
};

export function ClaimSticker({ claim, dimension, stageRef, onChange }: Props) {
  const onPointerDown = useDrag(stageRef, dimension.safe, (pos) => onChange(pos));

  const fontPx = claim.size * dimension.width;
  const padX = fontPx * 0.42;
  const padY = fontPx * 0.18;
  // Maximalbreite = Safety-Zone-Breite, damit lange Claims dort umbrechen.
  const maxW = dimension.width * (1 - dimension.safe.left - dimension.safe.right);

  return (
    <div
      className="claim-sticker"
      onPointerDown={(e) => onPointerDown(e, { x: claim.x, y: claim.y })}
      style={{
        left: `${claim.x * 100}%`,
        top: `${claim.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${claim.tilt}deg)`,
        maxWidth: maxW,
        background: STYLE_BG[claim.style],
        color: STYLE_FG[claim.style],
        padding: claim.style === "text" ? 0 : `${padY}px ${padX}px`,
        fontSize: fontPx,
        textTransform: claim.caps ? "uppercase" : "none",
        boxShadow: claim.style === "text" ? "none" : "var(--shadow-sticker)",
        textShadow:
          claim.style === "text" ? "0 2px 14px rgba(0,0,0,0.55)" : "none",
      }}
    >
      {claim.text || "Dein Claim"}
    </div>
  );
}
