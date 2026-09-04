import type { Dimension } from "../lib/dimensions";

// Kleine Swipe-Leiste: pro Slide ein nach rechts zeigendes Dreieck. Der aktuelle
// Slide ist deutlich größer und in Rose; bereits gewischte sind kräftig (River
// hell), noch kommende nur ganz schwach angedeutet.

type Props = {
  index: number;
  total: number;
  bottom: boolean;
  dimension: Dimension;
};

export function SwipeBar({ index, total, bottom, dimension }: Props) {
  if (total <= 1) return null;
  const size = Math.round(dimension.width * 0.0095);
  return (
    <div className={`cx-swipe${bottom ? " cx-swipe-bottom" : ""}`} style={{ gap: size }} aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const state = i < index ? "past" : i === index ? "now" : "future";
        const h = i === index ? size * 1.9 : size;
        return (
          <span
            key={i}
            className={`cx-tri cx-tri-${state}`}
            style={{ borderWidth: `${h}px 0 ${h}px ${h * 1.15}px` }}
          />
        );
      })}
    </div>
  );
}
