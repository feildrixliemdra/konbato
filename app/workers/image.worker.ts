/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-ignore
import * as UTIF from 'utif';

// Helper to check if file is TIFF
function isTiff(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'tif' || ext === 'tiff';
}

// Convert ArrayBuffer to ImageBitmap for standard formats
async function bufferToBitmap(buffer: ArrayBuffer, mimeType: string): Promise<ImageBitmap> {
  const blob = new Blob([buffer], { type: mimeType });
  return await createImageBitmap(blob);
}

// Convert TIFF ArrayBuffer to ImageBitmap using UTIF.js
function tiffToBitmap(buffer: ArrayBuffer): ImageBitmap {
  const ifds = UTIF.decode(buffer);
  if (!ifds || ifds.length === 0) {
    throw new Error('Invalid TIFF file');
  }
  
  // Decode the first page of TIFF
  UTIF.decodeImage(buffer, ifds[0]);
  const width = ifds[0].width;
  const height = ifds[0].height;
  const rgba = UTIF.toRGBA8(ifds[0]); // Uint8ClampedArray
  
  // Paint onto OffscreenCanvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get OffscreenCanvas 2D context');
  }
  
  const imageData = new ImageData(rgba, width, height);
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.transferToImageBitmap();
}

function resolveInputMime(fileName: string, mimeType?: string): string {
  if (mimeType) return mimeType;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

function getOutputMime(mimeType?: string): string {
  return mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/jpeg'
    ? mimeType
    : 'image/jpeg';
}

interface MetadataEntry {
  key: string;
  label: string;
  value: string;
}

const textDecoder = new TextDecoder('utf-8', { fatal: false });
const asciiDecoder = new TextDecoder('ascii', { fatal: false });

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

function parseTiffMetadata(buffer: ArrayBuffer, baseOffset = 0): MetadataEntry[] {
  const view = new DataView(buffer, baseOffset);
  const littleEndian = view.getUint16(0, false) === 0x4949;
  const bigEndian = view.getUint16(0, false) === 0x4d4d;
  if (!littleEndian && !bigEndian) return [];

  const entries: MetadataEntry[] = [];
  const getU16 = (offset: number) => view.getUint16(offset, littleEndian);
  const getU32 = (offset: number) => view.getUint32(offset, littleEndian);

  const readIfd = (ifdOffset: number, prefix: string) => {
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
        readIfd(getU32(valueOffset), `${prefix}-${tag}`);
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

  readIfd(getU32(4), 'ifd0');
  return entries;
}

function readImageMetadata(buffer: ArrayBuffer, fileName: string, mimeType?: string): MetadataEntry[] {
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
  } else if (isTiff(fileName)) {
    entries.push(...parseTiffMetadata(buffer));
  }

  return entries.slice(0, 40);
}

async function encodeCanvas(canvas: OffscreenCanvas, mimeType: string, quality = 0.9): Promise<ArrayBuffer> {
  const options: ImageEncodeOptions = { type: mimeType };
  if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
    options.quality = quality;
  }
  const blob = await canvas.convertToBlob(options);
  return await blob.arrayBuffer();
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'CONVERT') {
      const { buffer, fileName, targetMimeType } = payload;
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 20, message: 'Reading file...' } });
      
      let bitmap: ImageBitmap;
      if (isTiff(fileName)) {
        bitmap = tiffToBitmap(buffer);
      } else {
        // Retrieve MIME type from file extension if not provided
        const ext = fileName.split('.').pop()?.toLowerCase();
        let mime = 'image/jpeg';
        if (ext === 'png') mime = 'image/png';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'gif') mime = 'image/gif';
        bitmap = await bufferToBitmap(buffer, mime);
      }
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 50, message: 'Converting format...' } });
      
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D canvas context');
      }
      
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 80, message: 'Generating output...' } });
      
      if (typeof canvas.convertToBlob === 'function') {
        const options: any = { type: targetMimeType };
        if (targetMimeType === 'image/jpeg' || targetMimeType === 'image/webp') {
          options.quality = 0.85;
        }
        const outBlob = await canvas.convertToBlob(options);
        const outBuffer = await outBlob.arrayBuffer();
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: {
            buffer: outBuffer,
            mimeType: targetMimeType,
            width: bitmap.width,
            height: bitmap.height
          }
        }, [outBuffer]);
      } else {
        const outBitmap = canvas.transferToImageBitmap();
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: {
            bitmap: outBitmap,
            mimeType: targetMimeType,
            width: bitmap.width,
            height: bitmap.height
          }
        }, [outBitmap]);
      }
      
    } else if (type === 'COMPRESS') {
      const { buffer, fileName, quality, mimeType, width, height } = payload;
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 20, message: 'Reading file...' } });
      
      let bitmap: ImageBitmap;
      if (isTiff(fileName)) {
        bitmap = tiffToBitmap(buffer);
      } else {
        bitmap = await bufferToBitmap(buffer, mimeType);
      }
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 40, message: 'Resizing dimensions...' } });
      
      // Calculate aspect ratio resizing
      let targetWidth = width || bitmap.width;
      let targetHeight = height || bitmap.height;
      
      if (width && !height) {
        targetHeight = Math.round((bitmap.height * width) / bitmap.width);
      } else if (height && !width) {
        targetWidth = Math.round((bitmap.width * height) / bitmap.height);
      }
      
      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D canvas context');
      }
      
      // Paint image with new dimensions
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap.close();
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 70, message: 'Encoding image...' } });
      
      // Quality ranges from 0.0 to 1.0 in canvas blob conversion
      const canvasQuality = (quality || 80) / 100;
      const targetMime = mimeType || 'image/jpeg';
      
      // Only JPEG and WEBP support quality adjustments natively
      const compressionMime = (targetMime === 'image/jpeg' || targetMime === 'image/webp') 
        ? targetMime 
        : 'image/jpeg';
        
      if (typeof canvas.convertToBlob === 'function') {
        const outBlob = await canvas.convertToBlob({ 
          type: compressionMime, 
          quality: canvasQuality 
        });
        const outBuffer = await outBlob.arrayBuffer();
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: {
            buffer: outBuffer,
            mimeType: compressionMime,
            width: targetWidth,
            height: targetHeight
          }
        }, [outBuffer]);
      } else {
        const outBitmap = canvas.transferToImageBitmap();
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: {
            bitmap: outBitmap,
            mimeType: compressionMime,
            width: targetWidth,
            height: targetHeight
          }
        }, [outBitmap]);
      }
    } else if (type === 'RESIZE_CROP') {
      const {
        buffer,
        fileName,
        mimeType,
        targetMimeType,
        crop,
        targetWidth,
        targetHeight,
        quality,
      } = payload;

      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 20, message: 'Reading image pixels...' } });

      const inputMime = resolveInputMime(fileName, mimeType);
      const bitmap = isTiff(fileName) ? tiffToBitmap(buffer) : await bufferToBitmap(buffer, inputMime);
      const safeCrop = {
        x: Math.max(0, Math.min(Number(crop?.x ?? 0), bitmap.width - 1)),
        y: Math.max(0, Math.min(Number(crop?.y ?? 0), bitmap.height - 1)),
        width: Math.max(1, Math.min(Number(crop?.width ?? bitmap.width), bitmap.width)),
        height: Math.max(1, Math.min(Number(crop?.height ?? bitmap.height), bitmap.height)),
      };
      safeCrop.width = Math.min(safeCrop.width, bitmap.width - safeCrop.x);
      safeCrop.height = Math.min(safeCrop.height, bitmap.height - safeCrop.y);

      const outWidth = Math.max(1, Number(targetWidth || safeCrop.width));
      const outHeight = Math.max(1, Number(targetHeight || safeCrop.height));

      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 55, message: 'Cropping and resizing image...' } });

      const canvas = new OffscreenCanvas(outWidth, outHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        throw new Error('Failed to get 2D canvas context');
      }

      ctx.drawImage(
        bitmap,
        safeCrop.x,
        safeCrop.y,
        safeCrop.width,
        safeCrop.height,
        0,
        0,
        outWidth,
        outHeight
      );
      bitmap.close();

      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 85, message: 'Encoding output image...' } });
      const outputMime = getOutputMime(targetMimeType);
      const outBuffer = await encodeCanvas(canvas, outputMime, (quality || 90) / 100);
      (self as any).postMessage({
        id,
        type: 'SUCCESS',
        payload: {
          buffer: outBuffer,
          mimeType: outputMime,
          width: outWidth,
          height: outHeight,
        }
      }, [outBuffer]);
    } else if (type === 'READ_IMAGE_METADATA') {
      const { buffer, fileName, mimeType } = payload;
      self.postMessage({
        id,
        type: 'SUCCESS',
        payload: { metadata: readImageMetadata(buffer, fileName, mimeType) }
      });
    } else if (type === 'STRIP_IMAGE_METADATA') {
      const { buffer, fileName, mimeType, targetMimeType, quality } = payload;

      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 25, message: 'Reading visible pixels...' } });

      const inputMime = resolveInputMime(fileName, mimeType);
      const bitmap = isTiff(fileName) ? tiffToBitmap(buffer) : await bufferToBitmap(buffer, inputMime);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        throw new Error('Failed to get 2D canvas context');
      }

      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 80, message: 'Re-encoding without embedded metadata...' } });
      const outputMime = getOutputMime(targetMimeType || inputMime);
      const outBuffer = await encodeCanvas(canvas, outputMime, (quality || 92) / 100);
      (self as any).postMessage({
        id,
        type: 'SUCCESS',
        payload: {
          buffer: outBuffer,
          mimeType: outputMime,
          width: canvas.width,
          height: canvas.height,
        }
      }, [outBuffer]);
    } else {
      throw new Error(`Unsupported message type: ${type}`);
    }
  } catch (error: any) {
    self.postMessage({
      id,
      type: 'ERROR',
      payload: { message: error?.message || 'Unknown processing error' }
    });
  }
};
