import { test, expect } from '@playwright/test';
import {
  isTiffFileName,
  resolveInputMime,
  sniffImageFormat,
  parseTiffMetadata,
  readImageMetadata,
} from '../lib/image-format';

/**
 * Node-side unit coverage for the pure image-format helpers extracted from the
 * workers. No browser is needed — these only read bytes — so the spec mirrors
 * `tests/engine-map.spec.ts` and runs entirely in the Playwright Node runner.
 */

const bytes = (...values: number[]): ArrayBuffer => new Uint8Array(values).buffer;

/** A minimal JPEG carrying an `Exif\0\0` APP1 segment. */
function jpegWithExif(): ArrayBuffer {
  const exif = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
  const length = 2 + exif.length;
  return bytes(
    0xff, 0xd8, // SOI
    0xff, 0xe1, // APP1
    (length >> 8) & 0xff, length & 0xff,
    ...exif,
    0xff, 0xd9 // EOI
  );
}

test.describe('image-format helpers', () => {
  test('sniffImageFormat recognises each supported magic byte', () => {
    expect(sniffImageFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0))).toBe('png');
    expect(sniffImageFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg');
    expect(sniffImageFormat(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe('gif');
    expect(sniffImageFormat(bytes(0x42, 0x4d, 0, 0, 0, 0))).toBe('bmp');
    expect(sniffImageFormat(bytes(0x49, 0x49, 0x2a, 0x00))).toBe('tiff');
    expect(sniffImageFormat(bytes(0x4d, 0x4d, 0x00, 0x2a))).toBe('tiff');
    expect(sniffImageFormat(bytes(0, 0, 0, 0, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe('webp');
  });

  test('sniffImageFormat returns unknown for garbage', () => {
    expect(sniffImageFormat(bytes(0x00, 0x00, 0x00, 0x00, 0x00))).toBe('unknown');
    expect(sniffImageFormat(new ArrayBuffer(0))).toBe('unknown');
  });

  test('readImageMetadata surfaces an EXIF block from a JPEG', () => {
    const entries = readImageMetadata(jpegWithExif(), 'photo.jpg');
    expect(entries).toContainEqual({
      key: 'jpeg-exif',
      label: 'EXIF metadata block',
      value: 'Present',
    });
  });

  test('readImageMetadata returns nothing for a JPEG without metadata', () => {
    const bareJpeg = bytes(0xff, 0xd8, 0xff, 0xd9);
    expect(readImageMetadata(bareJpeg, 'bare.jpg')).toEqual([]);
  });

  test('parseTiffMetadata rejects non-TIFF bytes', () => {
    expect(parseTiffMetadata(bytes(0x00, 0x01, 0x02, 0x03))).toEqual([]);
  });

  test('isTiffFileName and resolveInputMime follow the extension', () => {
    expect(isTiffFileName('scan.TIFF')).toBe(true);
    expect(isTiffFileName('scan.png')).toBe(false);
    expect(resolveInputMime('a.png')).toBe('image/png');
    expect(resolveInputMime('a.webp')).toBe('image/webp');
    expect(resolveInputMime('a.gif')).toBe('image/gif');
    expect(resolveInputMime('a.unknown')).toBe('image/jpeg');
  });
});
