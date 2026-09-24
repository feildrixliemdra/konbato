/**
 * Shared, dependency-free watermark drawing used by both `app/workers/pdf.worker.ts`
 * (via OffscreenCanvas) and the `pdf-watermark` page's live preview (via <canvas>).
 * Keeping the geometry in one place is what makes the preview match the output
 * exactly. Everything is measured in canvas pixels; `pxPerPt` scales point-based
 * sizes (font) to the current render resolution.
 */

export type WatermarkKind = 'text' | 'image';

export type WatermarkPosition =
  | 'tiled'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface WatermarkSpec {
  kind: WatermarkKind;
  text: string;                       // text mode
  fontSizePt: number;                 // text mode, PDF points
  color: string;                      // text mode, '#rrggbb'
  image: CanvasImageSource | null;    // image mode, already-decoded bitmap
  sizePct: number;                    // image mode, width as % of page width
  opacity: number;                    // 0–100, both
  rotation: number;                   // degrees, both
  position: WatermarkPosition;        // both
}

/** Margin (fraction of the page's short edge) for the anchored positions. */
const MARGIN = 0.05;

const ANCHORS: Record<Exclude<WatermarkPosition, 'tiled'>, [number, number]> = {
  'top-left': [MARGIN, MARGIN],
  'top-center': [0.5, MARGIN],
  'top-right': [1 - MARGIN, MARGIN],
  'middle-left': [MARGIN, 0.5],
  center: [0.5, 0.5],
  'middle-right': [1 - MARGIN, 0.5],
  'bottom-left': [MARGIN, 1 - MARGIN],
  'bottom-center': [0.5, 1 - MARGIN],
  'bottom-right': [1 - MARGIN, 1 - MARGIN],
};

export function drawWatermark(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  spec: WatermarkSpec,
  pageW: number,
  pageH: number,
  pxPerPt: number
): void {
  ctx.save();
  ctx.globalAlpha = spec.opacity / 100;

  if (spec.kind === 'text') {
    const fontSizePx = spec.fontSizePt * pxPerPt;
    ctx.fillStyle = spec.color;
    ctx.font = `bold ${fontSizePx}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (spec.position === 'tiled') {
      const textWidth = ctx.measureText(spec.text).width;
      const stepX = textWidth + fontSizePx * 2;
      const stepY = fontSizePx * 3.5;
      const diag = Math.hypot(pageW, pageH);
      ctx.translate(pageW / 2, pageH / 2);
      ctx.rotate((spec.rotation * Math.PI) / 180);
      for (let x = -diag; x <= diag; x += stepX) {
        for (let y = -diag; y <= diag; y += stepY) {
          ctx.fillText(spec.text, x, y);
        }
      }
    } else {
      const [ax, ay] = ANCHORS[spec.position];
      ctx.translate(pageW * ax, pageH * ay);
      ctx.rotate((spec.rotation * Math.PI) / 180);
      ctx.fillText(spec.text, 0, 0);
    }
  } else if (spec.image) {
    // Both the worker and the preview pass an ImageBitmap, which carries
    // `width`/`height` directly.
    const img = spec.image as CanvasImageSource & { width: number; height: number };
    const targetW = (spec.sizePct / 100) * pageW;
    const targetH = (img.height / img.width) * targetW;

    if (spec.position === 'tiled') {
      const gapX = targetW * 1.5;
      const gapY = targetH * 1.5;
      const diag = Math.hypot(pageW, pageH);
      ctx.translate(pageW / 2, pageH / 2);
      ctx.rotate((spec.rotation * Math.PI) / 180);
      for (let x = -diag; x <= diag; x += gapX) {
        for (let y = -diag; y <= diag; y += gapY) {
          ctx.drawImage(img, x - targetW / 2, y - targetH / 2, targetW, targetH);
        }
      }
    } else {
      const [ax, ay] = ANCHORS[spec.position];
      ctx.translate(pageW * ax, pageH * ay);
      ctx.rotate((spec.rotation * Math.PI) / 180);
      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
    }
  }

  ctx.restore();
}
