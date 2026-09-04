import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Dimension } from "../lib/dimensions";

// Skaliert vollformatige Slide-Inhalte (in Export-Pixeln) per CSS-transform so,
// dass sie in den verfügbaren Platz passen — wie Stage.tsx, aber ohne
// Safety-Zone. Für große Vorschau UND Thumbnails wiederverwendet.

type Props = {
  dimension: Dimension;
  children: ReactNode;
  className?: string;
};

export function Scaled({ dimension, children, className }: Props) {
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
    <div className={`cx-scaled${className ? " " + className : ""}`} ref={wrapRef}>
      <div className="cx-scaled-box" style={{ width: dimension.width * scale, height: dimension.height * scale }}>
        <div
          className="cx-scaled-inner"
          style={{ width: dimension.width, height: dimension.height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
