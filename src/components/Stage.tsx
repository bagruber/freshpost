import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import type { Dimension } from "../lib/dimensions";

// Die Stage ist in echten Export-Pixeln dimensioniert (z.B. 1080×1920) und
// wird für die Vorschau per CSS-Transform herunterskaliert. So bleibt für den
// Export ein pixelgenaues Element, während der Bildschirm es passend zeigt.

type Props = {
  dimension: Dimension;
  background: ReactNode; // Hintergrund-Layer (unter allem)
  showSafeZone: boolean;
  warnSafeZone: boolean; // Claim ragt aus der Safety-Zone → Warnfarbe
  children: ReactNode;
};

export const Stage = forwardRef<HTMLDivElement, Props>(function Stage(
  { dimension, background, showSafeZone, warnSafeZone, children },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const fit = () => {
      setScale(
        Math.min(wrap.clientWidth / dimension.width, wrap.clientHeight / dimension.height),
      );
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [dimension]);

  const safe = dimension.safe;

  return (
    <div className="stage-wrap" ref={wrapRef}>
      <div
        className="stage-scaler"
        style={{ width: dimension.width * scale, height: dimension.height * scale }}
      >
        <div
          className="stage"
          ref={ref}
          style={{
            width: dimension.width,
            height: dimension.height,
            transform: `scale(${scale})`,
          }}
        >
          {background}
          {children}
        </div>
        {/* Safety-Zone außerhalb der skalierten Stage: Rahmen in echten
            Bildschirm-Pixeln (sonst auf Mobile fast unsichtbar) und nie im
            Export enthalten. */}
        {showSafeZone && (
          <div
            className={`safe-zone${warnSafeZone ? " safe-zone--warn" : ""}`}
            style={{
              top: `${safe.top * 100}%`,
              right: `${safe.right * 100}%`,
              bottom: `${safe.bottom * 100}%`,
              left: `${safe.left * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  );
});
