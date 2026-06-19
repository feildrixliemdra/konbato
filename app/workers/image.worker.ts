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
