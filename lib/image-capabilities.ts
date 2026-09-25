/**
 * Browser capability probes for encoders that are not universally available.
 *
 * AVIF decoding is near-universal, but AVIF *encoding* is not: Chromium can
 * encode it (via `canvas.toBlob` / `OffscreenCanvas.convertToBlob`), while
 * Safari and Firefox cannot. Tools must detect support before offering the
 * format, rather than failing mid-conversion.
 *
 * The probe runs a 1×1 canvas round-trip: `toBlob` only reports the requested
 * `type` when the encoder actually exists. The worker encodes through
 * `OffscreenCanvas.convertToBlob`, which shares the same encoder, so a
 * main-thread probe is representative. (There is no `ImageEncoder` in the
 * browser WebCodecs spec — only `ImageDecoder` — so canvas is the only probe
 * available.)
 *
 * Client-only: touches `window`/`document`. Only import from `'use client'`
 * modules (all tool pages already are).
 */
export function canEncodeAvif(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob(
        (blob) => resolve(!!blob && blob.type === 'image/avif'),
        'image/avif',
        0.5
      );
    } catch {
      // A synchronous throw means the encoder is unavailable — same as a
      // null blob, so resolve `false` rather than rejecting the callers.
      resolve(false);
    }
  });
}
