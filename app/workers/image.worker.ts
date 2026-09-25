/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-ignore
import * as UTIF from 'utif';
import { isTiffFileName, resolveInputMime, readImageMetadata } from '../../lib/image-format';

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

function getOutputMime(mimeType?: string): string {
  return mimeType === 'image/png' ||
    mimeType === 'image/webp' ||
    mimeType === 'image/jpeg' ||
    mimeType === 'image/avif'
    ? mimeType
    : 'image/jpeg';
}

async function encodeCanvas(canvas: OffscreenCanvas, mimeType: string, quality = 0.9): Promise<ArrayBuffer> {
  const options: ImageEncodeOptions = { type: mimeType };
  if (mimeType === 'image/jpeg' || mimeType === 'image/webp' || mimeType === 'image/avif') {
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
      if (isTiffFileName(fileName)) {
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
      const bitmapWidth = bitmap.width;
      const bitmapHeight = bitmap.height;
      bitmap.close();
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 80, message: 'Generating output...' } });
      
      if (typeof canvas.convertToBlob === 'function') {
        const options: any = { type: targetMimeType };
        if (targetMimeType === 'image/jpeg' || targetMimeType === 'image/webp' || targetMimeType === 'image/avif') {
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
            width: bitmapWidth,
            height: bitmapHeight
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
            width: bitmapWidth,
            height: bitmapHeight
          }
        }, [outBitmap]);
      }
      
    } else if (type === 'COMPRESS') {
      const { buffer, fileName, quality, mimeType, width, height } = payload;
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 20, message: 'Reading file...' } });
      
      let bitmap: ImageBitmap;
      if (isTiffFileName(fileName)) {
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
      
      // Preserve the input's format so a lossless/transparent image is never
      // silently re-encoded as lossy JPEG. Canvas cannot encode GIF, so GIF
      // falls back to PNG (lossless, keeps transparency) rather than JPEG
      // (which would paint transparency as a black background). TIFF (lossless,
      // huge) still compresses to JPEG; JPEG/WebP keep native quality control.
      const compressionMime =
        targetMime === 'image/png' || targetMime === 'image/gif'
          ? 'image/png'
          : targetMime === 'image/webp'
            ? 'image/webp'
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
      const bitmap = isTiffFileName(fileName) ? tiffToBitmap(buffer) : await bufferToBitmap(buffer, inputMime);
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
      const bitmap = isTiffFileName(fileName) ? tiffToBitmap(buffer) : await bufferToBitmap(buffer, inputMime);
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

// Signals that this module has finished evaluating and the handler above is
// installed, so `useWorker` knows it is safe to start posting work.
self.postMessage({ id: '__ready__', type: 'READY', payload: {} });
