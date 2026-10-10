'use client';

/* eslint-disable @next/next/no-img-element -- a blob: URL, not an optimisable asset */
import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

/** A box in page points: top-left origin, as the page is displayed. */
export interface PageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  pointerId: number;
  kind: 'move' | 'resize';
  startX: number;
  startY: number;
  startBox: PageBox;
}

const MIN_WIDTH_PT = 24;

/** Keeps the box on the page and at least MIN_WIDTH_PT wide, preserving aspect. */
export function clampBox(box: PageBox, pageWidth: number, pageHeight: number, aspect: number): PageBox {
  const maxWidth = Math.min(pageWidth, pageHeight * aspect);
  const width = Math.min(Math.max(box.width, Math.min(MIN_WIDTH_PT, maxWidth)), maxWidth);
  const height = width / aspect;
  return {
    width,
    height,
    x: Math.min(Math.max(box.x, 0), pageWidth - width),
    y: Math.min(Math.max(box.y, 0), pageHeight - height),
  };
}

interface PlacementBoxProps {
  box: PageBox;
  pageWidth: number;
  pageHeight: number;
  /** CSS pixels per PDF point for the preview as currently laid out. */
  scale: number;
  imageUrl: string;
  aspect: number;
  label: string;
  /** Receives an updater so rapid key repeats compose instead of overwriting. */
  onChange: (update: (prev: PageBox) => PageBox) => void;
  onRemove: () => void;
}

/**
 * A signature placed over the page preview. It is stored and edited in PDF
 * points, and only converted to pixels for display, so resizing the window or
 * rotating a phone never shifts where the signature lands in the file.
 *
 * The drag pattern (pointer capture, delta from the start box, clamp) follows
 * the crop frame in image-resize-crop; unlike that frame it moves the box over
 * a fixed page rather than panning the image under a fixed box.
 */
export function PlacementBox({
  box,
  pageWidth,
  pageHeight,
  scale,
  imageUrl,
  aspect,
  label,
  onChange,
  onRemove,
}: PlacementBoxProps) {
  const drag = useRef<DragState | null>(null);

  const startDrag = (kind: DragState['kind']) => (e: ReactPointerEvent<HTMLElement>) => {
    if (drag.current) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, kind, startX: e.clientX, startY: e.clientY, startBox: box };
  };

  const handleMove = (e: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== e.pointerId || scale <= 0) return;
    const dx = (e.clientX - state.startX) / scale;
    const dy = (e.clientY - state.startY) / scale;
    // Resizing from the bottom-right corner keeps the top-left anchored. The
    // axis that moved further drives the size, in either direction, so a
    // straight-left or straight-up drag shrinks it as readily as one inward.
    const dyAsWidth = dy * aspect;
    const grow = Math.abs(dx) >= Math.abs(dyAsWidth) ? dx : dyAsWidth;
    const next =
      state.kind === 'move'
        ? { ...state.startBox, x: state.startBox.x + dx, y: state.startBox.y + dy }
        : { ...state.startBox, width: state.startBox.width + grow };
    // A drag is absolute (start box + total delta), so it ignores prev.
    const box = clampBox(next, pageWidth, pageHeight, aspect);
    onChange(() => box);
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    // Built from `prev` rather than the `box` prop: key auto-repeat can fire
    // again before the parent re-renders, and each press must still count.
    let move: ((prev: PageBox) => PageBox) | null = null;
    if (e.key === 'ArrowLeft') move = (prev) => ({ ...prev, x: prev.x - step });
    else if (e.key === 'ArrowRight') move = (prev) => ({ ...prev, x: prev.x + step });
    else if (e.key === 'ArrowUp') move = (prev) => ({ ...prev, y: prev.y - step });
    else if (e.key === 'ArrowDown') move = (prev) => ({ ...prev, y: prev.y + step });
    else if (e.key === '+' || e.key === '=') move = (prev) => ({ ...prev, width: prev.width * 1.05 });
    else if (e.key === '-' || e.key === '_') move = (prev) => ({ ...prev, width: prev.width / 1.05 });
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onRemove();
      return;
    }
    if (!move) return;
    e.preventDefault();
    const apply = move;
    onChange((prev) => clampBox(apply(prev), pageWidth, pageHeight, aspect));
  };

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${label}. Drag to move, drag the corner to resize. Arrow keys move, Shift moves faster, plus and minus resize, Delete removes.`}
      onPointerDown={startDrag('move')}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className="group absolute cursor-grab touch-none rounded-sm outline outline-2 outline-offset-0 outline-primary/70 focus-visible:outline-primary active:cursor-grabbing"
      style={{
        left: box.x * scale,
        top: box.y * scale,
        width: box.width * scale,
        height: box.height * scale,
      }}
    >
      <img src={imageUrl} alt="" draggable={false} className="pointer-events-none size-full select-none object-contain" />

      <button
        type="button"
        aria-label={`Remove ${label}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        className="absolute -right-3 -top-3 grid size-6 place-items-center rounded-full bg-foreground text-background shadow-sm [@media(pointer:coarse)]:-right-5 [@media(pointer:coarse)]:-top-5 [@media(pointer:coarse)]:size-10"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" aria-hidden />
      </button>

      {/* The visible handle is small; on touch screens the hit area grows to 44px.
          Move/up events bubble from the captured handle to the group's handlers. */}
      <span
        aria-hidden
        onPointerDown={startDrag('resize')}
        className={cn(
          'absolute -bottom-2 -right-2 grid size-5 cursor-nwse-resize touch-none place-items-center',
          '[@media(pointer:coarse)]:-bottom-5 [@media(pointer:coarse)]:-right-5 [@media(pointer:coarse)]:size-11'
        )}
      >
        <span className="size-3 rounded-full border-2 border-background bg-primary shadow-sm" />
      </span>
    </div>
  );
}
