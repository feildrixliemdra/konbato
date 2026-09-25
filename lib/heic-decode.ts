/**
 * HEIC/HEIF decoding for the image converter.
 *
 * Browsers other than Safari cannot decode HEIC (HEVC-in-HEIF), so the file is
 * passed to libheif (via heic2any) and re-encoded to PNG before it reaches the
 * normal image pipeline. This runs on the main thread rather than in a worker:
 * heic2any is an asm.js libheif build that references `document`/`window`, and
 * the converter's processing overlay already covers the decode time. heic2any
 * is imported lazily so its ~1.3 MB bundle only loads when a HEIC is actually
 * converted, keeping every other image tool's worker lean.
 *
 * Client-only: only import from `'use client'` modules.
 */

export function isHeicFile(file: { name: string }): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'heic' || ext === 'heif';
}

export async function decodeHeicToPngBuffer(file: Blob): Promise<ArrayBuffer> {
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({ blob: file, toType: 'image/png' });
  const blob: Blob = Array.isArray(converted) ? converted[0] : converted;
  return await blob.arrayBuffer();
}
