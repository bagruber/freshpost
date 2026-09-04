import { useCallback, useEffect, useRef } from "react";

// Pointer-Drag-Primitive (Maus + Touch): kapselt das Anmelden/Abmelden der
// window-Listener. onMove kommt während des Ziehens, onEnd beim Loslassen.

type Handlers = {
  onMove: (e: PointerEvent) => void;
  onEnd?: (e: PointerEvent) => void;
};

export function usePointerDrag(handlers: Handlers) {
  // Aktuelle Handler über eine Ref, damit die Listener stabil bleiben.
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  const move = useRef((e: PointerEvent) => ref.current.onMove(e));
  const up = useRef((e: PointerEvent) => {
    ref.current.onEnd?.(e);
    window.removeEventListener("pointermove", move.current);
    window.removeEventListener("pointerup", up.current);
  });

  return useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    window.addEventListener("pointermove", move.current);
    window.addEventListener("pointerup", up.current);
  }, []);
}
