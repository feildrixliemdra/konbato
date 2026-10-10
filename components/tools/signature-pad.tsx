'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Caveat } from 'next/font/google';
import { HugeiconsIcon } from '@hugeicons/react';
import { Upload02Icon } from '@hugeicons/core-free-icons';
import { FieldInput } from '@/components/tools/field-input';
import { SegmentedControl } from '@/components/tools/segmented-control';
import { inkBounds } from '@/lib/signature-ink';
import { cn } from '@/lib/utils';

// Self-hosted at build time by next/font, so typing a signature never makes a
// network request — the same guarantee the file bytes get.
const caveat = Caveat({ subsets: ['latin'], weight: ['600'], display: 'swap' });

export interface SignatureImage {
  /** Trimmed PNG with a transparent background. */
  blob: Blob;
  /** width / height of the trimmed image. */
  aspect: number;
}

type Mode = 'draw' | 'type' | 'upload';
type Point = { x: number; y: number };

const INKS = [
  { value: '#111827', label: 'Black ink' },
  { value: '#1d4ed8', label: 'Blue ink' },
];

const MODES = [
  { value: 'draw', label: 'Draw' },
  { value: 'type', label: 'Type' },
  { value: 'upload', label: 'Upload' },
] as const;

const PAD_HEIGHT = 160;

/**
 * Crops a canvas to its non-transparent pixels plus a little padding. Every mode
 * goes through this so the placement box hugs the ink rather than the empty pad.
 */
function trimToInk(source: HTMLCanvasElement): Promise<SignatureImage | null> {
  const ctx = source.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  const bounds = inkBounds(ctx.getImageData(0, 0, source.width, source.height).data, source.width, source.height);
  if (!bounds) return Promise.resolve(null);
  const { x, y, width: w, height: h } = bounds;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d')?.drawImage(source, x, y, w, h, 0, 0, w, h);
  return new Promise((resolve) => {
    out.toBlob((blob) => resolve(blob ? { blob, aspect: w / h } : null), 'image/png');
  });
}

function drawStrokes(canvas: HTMLCanvasElement, strokes: Point[][], ink: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = canvas.width / canvas.clientWidth || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      ctx.beginPath();
      ctx.arc(stroke[0].x, stroke[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    // Quadratic curves through segment midpoints smooth out the jaggedness of
    // raw pointer samples without lagging behind the pen.
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length - 1; i++) {
      const mid = { x: (stroke[i].x + stroke[i + 1].x) / 2, y: (stroke[i].y + stroke[i + 1].y) / 2 };
      ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mid.x, mid.y);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
}

/**
 * Draw / Type / Upload signature input. Reports the active mode's signature (or
 * null when that mode is empty) so the page always reflects what is on screen.
 *
 * Uploaded images are file processing, so the page supplies `prepareUpload`,
 * which runs in the image worker; drawn and typed signatures are small canvases
 * the pad itself produced, and are trimmed here.
 */
export function SignaturePad({
  onChange,
  prepareUpload,
}: {
  onChange: (signature: SignatureImage | null) => void;
  prepareUpload: (file: ArrayBuffer, removePaper: boolean) => Promise<SignatureImage>;
}) {
  const [mode, setMode] = useState<Mode>('draw');
  const [ink, setInk] = useState(INKS[0].value);
  const [results, setResults] = useState<Record<Mode, SignatureImage | null>>({ draw: null, type: null, upload: null });

  const setResult = useCallback((m: Mode, value: SignatureImage | null) => {
    setResults((prev) => ({ ...prev, [m]: value }));
  }, []);

  // ---- Draw ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);

  // ---- Type ----
  const [typed, setTyped] = useState('');

  // ---- Upload ----
  const [uploaded, setUploaded] = useState<ArrayBuffer | null>(null);
  const [removePaper, setRemovePaper] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // An empty mode is derived rather than written into `results`, so clearing the
  // pad reports null immediately instead of after a render-and-effect round trip.
  const isEmpty = mode === 'draw' ? strokes.length === 0 : mode === 'type' ? !typed.trim() : !uploaded;
  const current = isEmpty ? null : results[mode];

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onChangeRef.current(current); }, [current]);
  const activeStroke = useRef<{ pointerId: number; points: Point[] } | null>(null);

  // The resize observer reads these instead of closing over state, so it is set
  // up once per mount of the pad rather than torn down after every stroke.
  const strokesRef = useRef(strokes);
  const inkRef = useRef(ink);
  useEffect(() => {
    strokesRef.current = strokes;
    inkRef.current = ink;
  }, [strokes, ink]);

  // Size the backing store to the element and the screen's pixel ratio so ink
  // stays sharp. Resizing a canvas clears it, so redraw after each resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== 'draw') return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(PAD_HEIGHT * dpr);
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      drawStrokes(canvas, strokesRef.current, inkRef.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [mode]);

  // Committed strokes or a new ink colour: redraw and re-export.
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawStrokes(canvas, strokes, ink);
    if (strokes.length === 0) return;
    let cancelled = false;
    trimToInk(canvas).then((sig) => { if (!cancelled) setResult('draw', sig); });
    return () => { cancelled = true; };
  }, [mode, strokes, ink, setResult]);

  const pointFor = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activeStroke.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activeStroke.current = { pointerId: e.pointerId, points: [pointFor(e)] };
    drawStrokes(e.currentTarget, [...strokes, activeStroke.current.points], ink);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const active = activeStroke.current;
    if (!active || active.pointerId !== e.pointerId) return;
    active.points.push(pointFor(e));
    drawStrokes(e.currentTarget, [...strokes, active.points], ink);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const active = activeStroke.current;
    if (!active || active.pointerId !== e.pointerId) return;
    activeStroke.current = null;
    setStrokes((prev) => [...prev, active.points]);
  };

  useEffect(() => {
    if (mode !== 'type') return;
    const text = typed.trim();
    if (!text) return;
    let cancelled = false;
    const fontSize = 96;
    const font = `600 ${fontSize}px ${caveat.style.fontFamily}`;
    // Canvas text silently falls back to a system font if the webfont hasn't
    // loaded yet, which would bake the wrong typeface into the PDF.
    document.fonts.load(font, text).then(() => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = font;
      canvas.width = Math.ceil(ctx.measureText(text).width + fontSize);
      canvas.height = Math.ceil(fontSize * 1.6);
      ctx.font = font;
      ctx.fillStyle = ink;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, fontSize / 2, canvas.height / 2);
      return trimToInk(canvas);
    }).then((sig) => { if (!cancelled && sig !== undefined) setResult('type', sig); });
    return () => { cancelled = true; };
  }, [mode, typed, ink, setResult]);

  useEffect(() => {
    if (mode !== 'upload' || !uploaded) return;
    let cancelled = false;
    prepareUpload(uploaded, removePaper)
      .then((sig) => { if (!cancelled) setResult('upload', sig); })
      .catch(() => {
        if (cancelled) return;
        setResult('upload', null);
        setUploadError('No signature found in that image. Try a clearer PNG or JPG.');
      });
    return () => { cancelled = true; };
  }, [mode, uploaded, removePaper, prepareUpload, setResult]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target.files?.[0];
    e.target.value = '';
    if (!target) return;
    // A new file must not briefly report the previous image as current.
    setResult('upload', null);
    setUploadError(null);
    setUploaded(await target.arrayBuffer());
  };

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl label="Signature input" value={mode} options={MODES} onChange={setMode} />

      {mode !== 'upload' && (
        <div role="group" aria-label="Ink color" className="flex items-center gap-2">
          <span className="text-xs font-semibold font-dm-sans">Ink:</span>
          {INKS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setInk(option.value)}
              aria-pressed={ink === option.value}
              aria-label={option.label}
              className={cn(
                'grid size-8 place-items-center rounded-full border transition-colors [@media(pointer:coarse)]:size-11',
                ink === option.value ? 'border-foreground/60' : 'border-border/60'
              )}
            >
              <span className="size-4 rounded-full" style={{ backgroundColor: option.value }} />
            </button>
          ))}
        </div>
      )}

      {mode === 'draw' && (
        <div className="flex flex-col gap-2">
          <canvas
            ref={canvasRef}
            aria-label="Signature drawing pad. Draw with a mouse, pen, or finger."
            role="img"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ height: PAD_HEIGHT }}
            className="w-full cursor-crosshair touch-none rounded-xl border border-dashed border-border/60 bg-white"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-dm-sans">Sign inside the box</span>
            <button
              type="button"
              onClick={() => {
                // Drop the exported image too, or the next stroke would briefly
                // report the cleared signature as current.
                setStrokes([]);
                setResult('draw', null);
              }}
              disabled={strokes.length === 0}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 [@media(pointer:coarse)]:min-h-11"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {mode === 'type' && (
        <div className="flex flex-col gap-3">
          <FieldInput
            type="text"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              // Same as Clear: emptying the field forgets the old rendering.
              if (!e.target.value.trim()) setResult('type', null);
            }}
            placeholder="Your name"
            aria-label="Type your signature"
            maxLength={60}
          />
          <div
            aria-hidden
            className={cn(
              'flex min-h-20 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/60 bg-white px-3 text-4xl',
              caveat.className
            )}
            style={{ color: ink }}
          >
            <span className="truncate">{typed.trim() || ' '}</span>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/5 py-6 text-xs font-semibold text-muted-foreground [@media(pointer:coarse)]:min-h-11">
            <HugeiconsIcon icon={Upload02Icon} className="size-5" aria-hidden />
            {uploaded ? 'Change signature image' : 'Upload signature image'}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleUpload} />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold font-dm-sans [@media(pointer:coarse)]:min-h-11">
            <input
              type="checkbox"
              checked={removePaper}
              onChange={(e) => setRemovePaper(e.target.checked)}
              className="size-4 accent-current"
            />
            Remove white background
          </label>
          {uploadError && <p role="alert" className="text-xs text-destructive font-dm-sans">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}
