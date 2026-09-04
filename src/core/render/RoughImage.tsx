import { useId } from "react";

// Ein oder mehrere Bilder mit EINER gemeinsamen rauen Sticker-Umrandung: die
// SVG-Filter-Kette (wie im Person-Modus) liegt auf dem Gruppen-Container, wirkt
// also auf die vereinigte Silhouette aller Bilder → mehrere Cutouts verschmelzen
// zu einem Sticker. Bilder überlappen sich automatisch.

const ALPHA_STEP = "0 0 0 0 0 0 0 1 1 1";
const ROUND_STEP = "0 0 0 0 0 1 1 1 1 1";
const ROUND_BLUR = 0.8;
const TURB_FREQ = 0.004;

type Item = { url: string; scale: number };
type Props = { items: Item[]; frameColor?: string; thickness?: number; rough?: number };

export function RoughImage({ items, frameColor, thickness = 12, rough = 11 }: Props) {
  const fid = `fpframe-${useId().replace(/:/g, "")}`;
  const n = items.length;
  return (
    <div className="fp-rough">
      <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
        <filter id={fid} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
          <feComponentTransfer in="SourceAlpha" result="solid">
            <feFuncA type="discrete" tableValues={ALPHA_STEP} />
          </feComponentTransfer>
          <feMorphology in="solid" operator="dilate" radius={thickness} result="dil" />
          <feTurbulence type="fractalNoise" baseFrequency={TURB_FREQ} numOctaves="1" seed="7" result="noise" />
          <feDisplacementMap in="dil" in2="noise" scale={rough} result="disp" />
          <feGaussianBlur in="disp" stdDeviation={ROUND_BLUR} result="blur" />
          <feComponentTransfer in="blur" result="rounded">
            <feFuncA type="discrete" tableValues={ROUND_STEP} />
          </feComponentTransfer>
          <feFlood floodColor={frameColor} result="col" />
          <feComposite in="col" in2="rounded" operator="in" result="frame" />
          <feMerge>
            <feMergeNode in="frame" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>
      <div className="fp-rough-grp" style={{ filter: `url(#${fid})` }}>
        {items.map((it, i) => {
          const leftPct = n <= 1 ? 50 : 15 + (i / (n - 1)) * 70;
          return (
            <img
              key={i}
              src={it.url}
              alt=""
              draggable={false}
              style={{ left: `${leftPct}%`, zIndex: i, transform: `translateX(-50%) scale(${it.scale})` }}
            />
          );
        })}
      </div>
    </div>
  );
}
