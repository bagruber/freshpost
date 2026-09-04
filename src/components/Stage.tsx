import { forwardRef, type ReactNode } from "react";
import type { Dimension } from "../core/canvas/dimension";
import { Scaled } from "../core/canvas/Scaled";

// Die Vorschau-Flaeche des Einzelpost-Werkzeugs: der skalierte Inhalt aus
// `Scaled` plus die Safety-Zone. Die Zone liegt bewusst als Overlay NEBEN dem
// skalierten Inhalt — so ist der Rahmen in echten Bildschirm-Pixeln sichtbar
// (auf Mobile sonst fast unsichtbar) und landet nie im Export.

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
  const safe = dimension.safe;

  return (
    <Scaled
      dimension={dimension}
      className="stage-wrap"
      contentRef={ref}
      overlay={
        showSafeZone && (
          <div
            className={`safe-zone${warnSafeZone ? " safe-zone--warn" : ""}`}
            style={{
              top: `${safe.top * 100}%`,
              right: `${safe.right * 100}%`,
              bottom: `${safe.bottom * 100}%`,
              left: `${safe.left * 100}%`,
            }}
          />
        )
      }
    >
      {background}
      {children}
    </Scaled>
  );
});
