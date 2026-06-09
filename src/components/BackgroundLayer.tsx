import { useCallback, useEffect, useRef, type CSSProperties, type RefObject } from "react";
import type { CoverGeom, Pos } from "../lib/geometry";
import type { Dimension } from "../lib/dimensions";

// Hintergrundbild als „Karte": 1 Finger / Maus = Pan, 2 Finger = Pinch-Zoom,
// Mausrad = Zoom um den Cursor. Grenzen (Cover … 1:1) macht der Aufrufer/Hook.

type Props = {
  src: string;
  imgRef: RefObject<HTMLImageElement | null>;
  style: CSSProperties; // width/height/transform aus dem Hook
  stageRef: RefObject<HTMLDivElement | null>;
  dimension: Dimension;
  geom: CoverGeom | null;
  zoom: number;
  pan: Pos;
  setView: (zoom: number, pan: Pos) => void;
};

export function BackgroundLayer({ src, imgRef, style, stageRef, dimension, geom, zoom, pan, setView }: Props) {
  // Aktuelle Werte als Refs, damit die einmalig registrierten Listener sie sehen.
  const live = useRef({ dimension, geom, zoom, pan, setView });
  useEffect(() => {
    live.current = { dimension, geom, zoom, pan, setView };
  });

  const pointers = useRef(new Map<number, Pos>());
  const gesture = useRef<{ mid: Pos | null; dist: number }>({ mid: null, dist: 0 });

  // Liest nur stabile Refs → useCallback ohne Dependencies.
  const toStage = useCallback((e: { clientX: number; clientY: number }): Pos => {
    const rect = stageRef.current!.getBoundingClientRect();
    const { width: W, height: H } = live.current.dimension;
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  }, [stageRef]);

  // Zoom um einen Fixpunkt: Inhalt unter `at` bleibt stehen.
  const zoomAround = useCallback((at: Pos, factor: number, basePan: Pos, baseZoom: number) => {
    const { geom, dimension, setView } = live.current;
    if (!geom) return;
    const z = Math.min(geom.zoomMax, Math.max(1, baseZoom * factor));
    const r = z / baseZoom;
    const cx = dimension.width / 2;
    const cy = dimension.height / 2;
    setView(z, {
      x: at.x - (at.x - (cx + basePan.x)) * r - cx,
      y: at.y - (at.y - (cy + basePan.y)) * r - cy,
    });
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      e.preventDefault();
      pointers.current.set(e.pointerId, toStage(e));
      const pts = [...pointers.current.values()];
      const g = gesture.current;
      const { zoom, pan } = live.current;

      if (pts.length >= 2) {
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        if (!g.mid) {
          gesture.current = { mid, dist };
          return;
        }
        // Erst Pan über Mittelpunkt-Bewegung, dann Zoom um den Mittelpunkt.
        const panned = { x: pan.x + (mid.x - g.mid.x), y: pan.y + (mid.y - g.mid.y) };
        zoomAround(mid, dist / g.dist, panned, zoom);
        gesture.current = { mid, dist };
      } else {
        const p = pts[0];
        if (!g.mid) {
          gesture.current = { mid: p, dist: 0 };
          return;
        }
        live.current.setView(zoom, { x: pan.x + (p.x - g.mid.x), y: pan.y + (p.y - g.mid.y) });
        gesture.current = { mid: p, dist: 0 };
      }
    };
    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      gesture.current = { mid: null, dist: 0 };
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [toStage, zoomAround]);

  // Mausrad-Zoom (Desktop), nicht-passiv, damit das Scrollen unterbleibt.
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom, pan } = live.current;
      zoomAround(toStage(e), Math.exp(-e.deltaY * 0.0015), pan, zoom);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [imgRef, toStage, zoomAround]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    pointers.current.set(e.pointerId, toStage(e));
    gesture.current = { mid: null, dist: 0 };
  };

  return (
    <img
      ref={imgRef}
      className="bg-image"
      src={src}
      alt=""
      draggable={false}
      onPointerDown={onPointerDown}
      style={style}
    />
  );
}
