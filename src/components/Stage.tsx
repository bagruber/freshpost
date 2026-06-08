import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import type { Dimension } from "../lib/dimensions";

// Die Stage ist in echten Export-Pixeln dimensioniert (z.B. 1080×1920) und
// wird für die Vorschau per CSS-Transform herunterskaliert. So bleibt für den
// Export ein pixelgenaues Element, während der Bildschirm es passend zeigt.

type Props = {
  dimension: Dimension;
  background: string | null;
  showSafeZone: boolean;
  children: ReactNode;
};

export const Stage = forwardRef<HTMLDivElement, Props>(function Stage(
  { dimension, background, showSafeZone, children },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Skaliert die Stage so, dass sie in den verfügbaren Platz passt.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const fit = () => {
      const availW = wrap.clientWidth;
      const availH = wrap.clientHeight;
      setScale(Math.min(availW / dimension.width, availH / dimension.height));
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
            backgroundImage: background ? `url(${background})` : undefined,
          }}
        >
          {showSafeZone && (
            <div
              data-export-ignore
              className="safe-zone"
              style={{
                top: `${safe.top * 100}%`,
                right: `${safe.right * 100}%`,
                bottom: `${safe.bottom * 100}%`,
                left: `${safe.left * 100}%`,
              }}
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
});
