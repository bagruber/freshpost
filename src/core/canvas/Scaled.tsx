import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import type { Dimension } from "../../lib/dimensions";

// Inhalte liegen in echten Export-Pixeln (z. B. 1080×1920) und werden fuer die
// Anzeige per CSS-Transform heruntergerechnet. So bleibt ein pixelgenaues
// Element fuer den Export uebrig, waehrend der Bildschirm es passend zeigt.
//
// Aufbau: wrap (fuellt den Platz) > box (Groesse nach Skalierung) >
// inner (Export-Pixel, transform-origin top-left). `overlay` liegt im
// Box-Raum, also NEBEN dem skalierten Inhalt — was dort landet, ist in echten
// Bildschirm-Pixeln sichtbar und kommt nie in den Export.

type Props = {
  dimension: Dimension;
  className?: string;
  contentRef?: Ref<HTMLDivElement>;
  overlay?: ReactNode;
  children: ReactNode;
};

export function Scaled({ dimension, className, contentRef, overlay, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const fit = () => {
      const s = Math.min(wrap.clientWidth / dimension.width, wrap.clientHeight / dimension.height);
      setScale(s > 0 ? s : 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [dimension]);

  return (
    <div className={`fp-scaled${className ? " " + className : ""}`} ref={wrapRef}>
      <div className="fp-scaled-box" style={{ width: dimension.width * scale, height: dimension.height * scale }}>
        <div
          className="fp-scaled-inner"
          ref={contentRef}
          style={{ width: dimension.width, height: dimension.height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
        {overlay}
      </div>
    </div>
  );
}
