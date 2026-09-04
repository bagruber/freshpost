import { useState } from "react";
import { useBrand } from "../brand/context";
import { getLayout } from "../brand/contract";
import type { Dimension } from "../core/canvas/dimension";
import { Scaled } from "../core/canvas/Scaled";
import { FrameView, type FrameTheme } from "../core/render/FrameView";
import { MAX_FRAMES, type Frame } from "../core/doc/composition";

// Filmstreifen: die Plaetze der Folge plus eine Palette der Layouts der Marke.
// Bedienung per Drag-and-Drop: eine Vorlage auf einen Platz ziehen setzt
// dessen Layout, Plaetze untereinander ziehen ordnet um. Klick waehlt bzw.
// haengt an.

const LAYOUT_MIME = "application/x-brand-layout";
const SLOT_MIME = "application/x-frame-slot";

type Props = {
  frames: Frame[];
  selectedId: string;
  dimension: Dimension;
  theme: FrameTheme;
  onSelect: (id: string) => void;
  onAdd: (layoutId?: string) => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onSetLayout: (id: string, layoutId: string) => void;
};

export function Filmstrip(props: Props) {
  const { frames, selectedId, dimension, theme } = props;
  const { onSelect, onAdd, onRemove, onMove, onSetLayout } = props;
  const brand = useBrand();
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const full = frames.length >= MAX_FRAMES;
  const known = (v: string) => brand.layouts.some((l) => l.key === v);

  const handleDrop = (e: React.DragEvent, index: number, id: string) => {
    e.preventDefault();
    setDropTarget(null);
    const layoutId = e.dataTransfer.getData(LAYOUT_MIME);
    if (layoutId && known(layoutId)) return onSetLayout(id, layoutId);
    const from = e.dataTransfer.getData(SLOT_MIME);
    if (from !== "") onMove(Number(from), index);
  };

  return (
    <div className="cx-strip">
      <div className="cx-palette" role="list" aria-label="Layout-Vorlagen">
        <span className="cx-strip-title">Vorlagen</span>
        {brand.layouts.map((l) => (
          <button
            key={l.key}
            type="button"
            role="listitem"
            className="cx-pal-chip"
            title={l.hint}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(LAYOUT_MIME, l.key);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onAdd(l.key)}
          >
            {l.label}
            <span className="cx-pal-plus" aria-hidden>＋</span>
          </button>
        ))}
      </div>

      <div className="cx-slots" role="list" aria-label="Folge">
        {frames.map((f, i) => {
          const label = getLayout(brand, f.layoutId).label;
          return (
            <div
              key={f.id}
              role="listitem"
              className={`cx-slot${f.id === selectedId ? " active" : ""}${dropTarget === f.id ? " drop" : ""}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(SLOT_MIME, String(i));
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(f.id);
              }}
              onDragLeave={() => setDropTarget((t) => (t === f.id ? null : t))}
              onDrop={(e) => handleDrop(e, i, f.id)}
              onClick={() => onSelect(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(f.id);
                }
              }}
              tabIndex={0}
              aria-label={`Bild ${i + 1}, ${label}${f.id === selectedId ? " (ausgewählt)" : ""}`}
              aria-current={f.id === selectedId}
            >
              <span className="cx-slot-no">{i + 1}</span>
              <div className="cx-slot-thumb" style={{ aspectRatio: `${dimension.width} / ${dimension.height}` }}>
                <Scaled dimension={dimension}>
                  <FrameView frame={f} brand={brand} dimension={dimension} theme={theme} index={i} total={frames.length} />
                </Scaled>
              </div>
              <span className="cx-slot-layout">{label}</span>
              {frames.length > 1 && (
                <button
                  type="button"
                  className="cx-slot-del"
                  title="Bild entfernen"
                  aria-label={`Bild ${i + 1} entfernen`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(f.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {!full && (
          <button
            type="button"
            className={`cx-slot cx-slot-add${dropTarget === "add" ? " drop" : ""}`}
            style={{ aspectRatio: `${dimension.width} / ${dimension.height}` }}
            onClick={() => onAdd()}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget("add");
            }}
            onDragLeave={() => setDropTarget((t) => (t === "add" ? null : t))}
            onDrop={(e) => {
              e.preventDefault();
              setDropTarget(null);
              const layoutId = e.dataTransfer.getData(LAYOUT_MIME);
              onAdd(layoutId && known(layoutId) ? layoutId : undefined);
            }}
            aria-label="Bild hinzufügen"
          >
            <span className="cx-add-plus" aria-hidden>＋</span>
            <span>Bild</span>
          </button>
        )}
      </div>
    </div>
  );
}
