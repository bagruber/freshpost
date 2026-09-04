import { useState } from "react";
import type { Dimension } from "../core/canvas/dimension";
import type { Slide, LayoutType } from "./model";
import { LAYOUTS, LAYOUT_LABEL, LAYOUT_HINT, MAX_SLIDES } from "./model";
import { SlideView, type RenderTheme } from "./SlideView";
import { Scaled } from "../core/canvas/Scaled";

// Filmstreifen: die Plätze (Slots) der Folge + eine Palette der Layout-Vorlagen.
// Bedienung per Drag-and-Drop (Laptop): Vorlage auf einen Slot ziehen setzt
// dessen Layout; Slots untereinander ziehen ordnet um. Klick wählt/fügt hinzu.

const LAYOUT_MIME = "application/x-fresh-layout";
const SLOT_MIME = "application/x-fresh-slot";

function asLayout(v: string): LayoutType | null {
  return (LAYOUTS as readonly string[]).includes(v) ? (v as LayoutType) : null;
}

type Props = {
  slides: Slide[];
  selectedId: string;
  dimension: Dimension;
  theme: RenderTheme;
  onSelect: (id: string) => void;
  onAdd: (layout?: LayoutType) => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onSetLayout: (id: string, layout: LayoutType) => void;
};

export function Filmstrip(props: Props) {
  const { slides, selectedId, dimension, theme } = props;
  const { onSelect, onAdd, onRemove, onMove, onSetLayout } = props;
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const full = slides.length >= MAX_SLIDES;

  const handleDrop = (e: React.DragEvent, index: number, id: string) => {
    e.preventDefault();
    setDropTarget(null);
    const layout = asLayout(e.dataTransfer.getData(LAYOUT_MIME));
    if (layout) {
      onSetLayout(id, layout);
      return;
    }
    const from = e.dataTransfer.getData(SLOT_MIME);
    if (from !== "") onMove(Number(from), index);
  };

  return (
    <div className="cx-strip">
      <div className="cx-palette" role="list" aria-label="Layout-Vorlagen">
        <span className="cx-strip-title">Vorlagen</span>
        {LAYOUTS.map((l) => (
          <button
            key={l}
            type="button"
            role="listitem"
            className="cx-pal-chip"
            title={LAYOUT_HINT[l]}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(LAYOUT_MIME, l);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onAdd(l)}
          >
            {LAYOUT_LABEL[l]}
            <span className="cx-pal-plus" aria-hidden>＋</span>
          </button>
        ))}
      </div>

      <div className="cx-slots" role="list" aria-label="Folge">
        {slides.map((s, i) => (
          <div
            key={s.id}
            role="listitem"
            className={`cx-slot${s.id === selectedId ? " active" : ""}${dropTarget === s.id ? " drop" : ""}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(SLOT_MIME, String(i));
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget(s.id);
            }}
            onDragLeave={() => setDropTarget((t) => (t === s.id ? null : t))}
            onDrop={(e) => handleDrop(e, i, s.id)}
            onClick={() => onSelect(s.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(s.id);
              }
            }}
            tabIndex={0}
            aria-label={`Slide ${i + 1}, ${LAYOUT_LABEL[s.layout]}${s.id === selectedId ? " (ausgewählt)" : ""}`}
            aria-current={s.id === selectedId}
          >
            <span className="cx-slot-no">{i + 1}</span>
            <div className="cx-slot-thumb" style={{ aspectRatio: `${dimension.width} / ${dimension.height}` }}>
              <Scaled dimension={dimension}>
                <SlideView slide={s} index={i} total={slides.length} dimension={dimension} theme={theme} />
              </Scaled>
            </div>
            <span className="cx-slot-layout">{LAYOUT_LABEL[s.layout]}</span>
            {slides.length > 1 && (
              <button
                type="button"
                className="cx-slot-del"
                title="Slide entfernen"
                aria-label={`Slide ${i + 1} entfernen`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(s.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}

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
              const layout = asLayout(e.dataTransfer.getData(LAYOUT_MIME));
              onAdd(layout ?? undefined);
            }}
            aria-label="Slide hinzufügen"
          >
            <span className="cx-add-plus" aria-hidden>＋</span>
            <span>Slide</span>
          </button>
        )}
      </div>
    </div>
  );
}
