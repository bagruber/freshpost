// Fortschrittsanzeige eines mehrteiligen Beitrags: pro Frame ein nach rechts
// zeigendes Dreieck. Der aktuelle ist deutlich groesser; bereits gesehene sind
// kraeftig, kommende nur angedeutet.
//
// Die drei Farben kommen aus der Marke (brand.progress). Fehlt das Feld, gibt
// es die Anzeige nicht — deshalb entscheidet der Aufrufer, ob er sie rendert.

type Props = {
  index: number;
  total: number;
  place: "top" | "bottom";
  width: number;
  colors: { past: string; now: string; future: string };
};

export function Progress({ index, total, place, width, colors }: Props) {
  if (total <= 1) return null;
  const size = Math.round(width * 0.0095);
  return (
    <div className={`fp-progress fp-progress-${place}`} style={{ gap: size }} aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const color = i < index ? colors.past : i === index ? colors.now : colors.future;
        const h = i === index ? size * 1.9 : size;
        return (
          <span
            key={i}
            className="fp-tri"
            style={{ borderWidth: `${h}px 0 ${h}px ${h * 1.15}px`, borderLeftColor: color }}
          />
        );
      })}
    </div>
  );
}
