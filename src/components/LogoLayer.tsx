import type { CSSProperties } from "react";
import type { Dimension } from "../core/canvas/dimension";
import type { LogoCorner, LogoSize } from "../core/doc/logo";
import { useBrand } from "../brand/context";

// Logo-Sticker: snappt unten in die Safety-Zone (links/mittig/rechts), feste
// Größen, nicht ziehbar (pointer-events: none — blockiert keine Drags darunter).

type Props = {
  url: string;
  corner: LogoCorner;
  size: LogoSize;
  dimension: Dimension;
};

export function LogoLayer({ url, corner, size, dimension }: Props) {
  const brand = useBrand();
  const safe = dimension.safe;
  const style: CSSProperties = {
    width: dimension.width * brand.logo.widths[size],
    bottom: `${safe.bottom * 100}%`,
  };
  if (corner === "bl") style.left = `${safe.left * 100}%`;
  else if (corner === "br") style.right = `${safe.right * 100}%`;
  else {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  }

  return <img className="logo-layer" src={url} alt="" draggable={false} style={style} />;
}
