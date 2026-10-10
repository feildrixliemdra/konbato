/**
 * Pixel helpers for signature images, shared by the signature pad (drawn and
 * typed signatures, main thread) and the image worker (uploaded ones). Pure
 * functions over RGBA data so they run in either place.
 */

/** Channels above this read as paper, not ink, when removing a white background. */
const PAPER_THRESHOLD = 225;
/** Alpha at or below this is treated as empty when finding the ink. */
const INK_ALPHA = 8;

/** Makes near-white pixels transparent, in place. */
export function clearPaper(px: Uint8ClampedArray) {
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] > PAPER_THRESHOLD && px[i + 1] > PAPER_THRESHOLD && px[i + 2] > PAPER_THRESHOLD) px[i + 3] = 0;
  }
}

/**
 * The bounding box of non-transparent pixels plus a little padding, or null
 * when there is no ink. Cropping to it makes the placement box hug the
 * signature rather than the empty pad or paper around it.
 */
export function inkBounds(
  px: Uint8ClampedArray,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } | null {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (px[(y * width + x) * 4 + 3] > INK_ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const pad = Math.round(Math.max(width, height) * 0.01) + 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
