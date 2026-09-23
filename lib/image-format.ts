/**
 * Pure, environment-agnostic image-format and metadata helpers.
 *
 * Extracted from the image worker so a Node-side Playwright spec can exercise
 * them directly: the workers are only reachable through the browser, which
 * makes their parsers slow and indirect to test. Everything here depends only
 * on `TextDecoder`/`DataView`, available in workers, Node and the browser, so
 * the module imports nothing that could pin it to one runtime.
 */

export type RasterFormat = 'png' | 'jpeg' | 'gif' | 'bmp' | 'tiff' | 'webp' | 'unknown';

export interface MetadataEntry {
  key: string;
  label: string;
  value: string;
}

const textDecoder = new TextDecoder('utf-8', { fatal: false });
const asciiDecoder = new TextDecoder('ascii', { fatal: false });

/** Extension-based TIFF detection; `file.type` is unreliable for renamed files. */
export function isTiffFileName(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'tif' || ext === 'tiff';
}

/** Resolves a MIME type from the file name when the browser supplied none. */
export function resolveInputMime(fileName: string, mimeType?: string): string {
  if (mimeType) return mimeType;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

/** Magic-byte sniffing — `file.type` is unreliable for dropped/renamed files. */
export function sniffImageFormat(buffer: ArrayBuffer): RasterFormat {
  const b = new Uint8Array(buffer);
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'gif';
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
  if (b.length >= 3 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00))) return 'tiff';
  if (b.length >= 12 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
  return 'unknown';
}

const tiffTagLabels: Record<number, string> = {
  0x010e: 'Image description',
  0x010f: 'Camera make',
  0x0110: 'Camera model',
  0x0112: 'Orientation',
  0x0131: 'Software',
  0x0132: 'Date/time',
  0x013b: 'Artist',
  0x8298: 'Copyright',
  0x8769: 'EXIF details',
  0x8825: 'GPS data',
  0x9003: 'Original date/time',
  0x9004: 'Digitized date/time',
  0x9286: 'User comment',
  0xa434: 'Lens model',
};

function pushUnique(entries: MetadataEntry[], key: string, label: string, value = 'Present') {
  if (!entries.some((entry) => entry.key === key && entry.value === value)) {
    entries.push({ key, label, value });
  }
}

function readString(view: DataView, offset: number, length: number) {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  return textDecoder.decode(bytes).replace(/\0+$/g, '').trim();
}

function readFourCc(view: DataView, offset: number) {
  return asciiDecoder.decode(new Uint8Array(view.buffer, view.byteOffset + offset, 4));
}

export function parseTiffMetadata(buffer: ArrayBuffer, baseOffset = 0): MetadataEntry[] {
  // A truncated segment (e.g. an `Exif\0\0` APP1 with no TIFF header after it)
  // must not throw: reading a 16-bit endian marker from fewer than 2 bytes
  // would otherwise blow up on malformed input.
  if (buffer.byteLength - baseOffset < 2) return [];
  const view = new DataView(buffer, baseOffset);
  const littleEndian = view.getUint16(0, false) === 0x4949;
  const bigEndian = view.getUint16(0, false) === 0x4d4d;
  if (!littleEndian && !bigEndian) return [];

  const entries: MetadataEntry[] = [];
  const getU16 = (offset: number) => view.getUint16(offset, littleEndian);
  const getU32 = (offset: number) => view.getUint32(offset, littleEndian);

  // Sub-IFD traversal (EXIF/GPS) recurses; cap the depth so a crafted cyclic
  // IFD chain cannot overflow the stack on the user's own tab.
  const MAX_IFD_DEPTH = 8;

  const readIfd = (ifdOffset: number, prefix: string, depth: number) => {
    if (depth > MAX_IFD_DEPTH) return;
    if (ifdOffset <= 0 || ifdOffset + 2 > view.byteLength) return;
    const count = Math.min(getU16(ifdOffset), 256);

    for (let index = 0; index < count; index++) {
      const offset = ifdOffset + 2 + index * 12;
      if (offset + 12 > view.byteLength) break;

      const tag = getU16(offset);
      const format = getU16(offset + 2);
      const components = getU32(offset + 4);
      const valueOffset = offset + 8;
      const label = tiffTagLabels[tag];
      if (!label) continue;

      if ((tag === 0x8769 || tag === 0x8825) && components === 1) {
        pushUnique(entries, `${prefix}-${tag}`, label, 'Present');
        readIfd(getU32(valueOffset), `${prefix}-${tag}`, depth + 1);
        continue;
      }

      if (format === 2 && components > 0) {
        const length = Math.min(components, 256);
        const stringOffset = length <= 4 ? valueOffset : getU32(valueOffset);
        if (stringOffset > 0 && stringOffset + length <= view.byteLength) {
          const value = readString(view, stringOffset, length);
          if (value) pushUnique(entries, `${prefix}-${tag}`, label, value);
        }
      } else {
        pushUnique(entries, `${prefix}-${tag}`, label, 'Present');
      }
    }
  };

  readIfd(getU32(4), 'ifd0', 0);
  return entries;
}

export function readImageMetadata(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType?: string
): MetadataEntry[] {
  const inputMime = resolveInputMime(fileName, mimeType);
  const view = new DataView(buffer);
  const entries: MetadataEntry[] = [];

  if (inputMime === 'image/jpeg' && view.byteLength > 4 && view.getUint16(0) === 0xffd8) {
    let offset = 2;
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + 2 + length > view.byteLength) break;

      const payloadOffset = offset + 4;
      const payloadLength = length - 2;
      const header = readString(view, payloadOffset, Math.min(payloadLength, 32));

      if (marker === 0xe1 && header.startsWith('Exif')) {
        pushUnique(entries, 'jpeg-exif', 'EXIF metadata block', 'Present');
        entries.push(...parseTiffMetadata(buffer.slice(payloadOffset + 6, payloadOffset + payloadLength)));
      } else if (marker === 0xe1 && header.includes('http://ns.adobe.com/xap/1.0/')) {
        pushUnique(entries, 'jpeg-xmp', 'XMP metadata block', 'Present');
      } else if (marker === 0xe2 && header.startsWith('ICC_PROFILE')) {
        pushUnique(entries, 'jpeg-icc', 'ICC color profile', 'Present');
      } else if (marker === 0xed) {
        pushUnique(entries, 'jpeg-iptc', 'Photoshop/IPTC metadata', 'Present');
      }

      offset += 2 + length;
    }
  } else if (inputMime === 'image/png' && view.byteLength > 24 && view.getUint32(0) === 0x89504e47) {
    let offset = 8;
    while (offset + 12 <= view.byteLength) {
      const length = view.getUint32(offset);
      const type = readFourCc(view, offset + 4);
      if (offset + 12 + length > view.byteLength) break;

      if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
        const raw = readString(view, offset + 8, Math.min(length, 128));
        const keyword = raw.split('\0')[0] || 'Text metadata';
        pushUnique(entries, `png-${type}-${keyword}`, `PNG ${type} chunk`, keyword);
      } else if (type === 'eXIf') {
        pushUnique(entries, 'png-exif', 'EXIF metadata block', 'Present');
      } else if (type === 'iCCP') {
        pushUnique(entries, 'png-icc', 'ICC color profile', 'Present');
      }

      offset += 12 + length;
      if (type === 'IEND') break;
    }
  } else if (inputMime === 'image/webp' && view.byteLength > 16 && readFourCc(view, 0) === 'RIFF' && readFourCc(view, 8) === 'WEBP') {
    let offset = 12;
    while (offset + 8 <= view.byteLength) {
      const type = readFourCc(view, offset);
      const length = view.getUint32(offset + 4, true);
      if (type === 'EXIF') pushUnique(entries, 'webp-exif', 'EXIF metadata block', 'Present');
      if (type === 'XMP ') pushUnique(entries, 'webp-xmp', 'XMP metadata block', 'Present');
      if (type === 'ICCP') pushUnique(entries, 'webp-icc', 'ICC color profile', 'Present');
      offset += 8 + length + (length % 2);
    }
  } else if (isTiffFileName(fileName)) {
    entries.push(...parseTiffMetadata(buffer));
  }

  return entries.slice(0, 40);
}
