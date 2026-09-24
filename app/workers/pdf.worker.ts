/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// @ts-ignore
import * as mupdf from 'mupdf';
import { sniffImageFormat, type RasterFormat } from '../../lib/image-format';
import { drawWatermark } from '../../lib/watermark-draw';

// Helper to destroy MuPDF WebAssembly memory objects safely
function safeDestroy(obj: any) {
  if (obj && typeof obj.destroy === 'function') {
    try {
      obj.destroy();
    } catch (e) {
      console.warn('Failed to destroy mupdf object:', e);
    }
  }
}

function copyPdfBuffer(outBuffer: any): ArrayBuffer {
  const outArray = outBuffer.asUint8Array();
  return outArray.buffer.slice(outArray.byteOffset, outArray.byteOffset + outArray.byteLength);
}

const PDF_METADATA_KEYS = [
  'info:Title',
  'info:Author',
  'info:Subject',
  'info:Keywords',
  'info:Creator',
  'info:Producer',
  'info:CreationDate',
  'info:ModDate',
  'info:Trapped',
];

/**
 * Hard ceiling on pages for the all-pages-at-once rasterisation paths (deep
 * compress and PDF-to-image). Each page's bitmap is held in memory until the
 * whole batch is transferred at once, so an unbounded document can exhaust the
 * tab. This is a product decision, not a capability limit: MuPDF would happily
 * rasterise more.
 */
const MAX_RASTER_PAGES = 200;

function tooManyPages(numPages: number): Error | null {
  if (numPages > MAX_RASTER_PAGES) {
    return new Error(
      `This document has ${numPages} pages. To keep your browser stable, ` +
        `process up to ${MAX_RASTER_PAGES} pages at a time.`
    );
  }
  return null;
}

function scrubPdfMetadata(doc: any) {
  PDF_METADATA_KEYS.forEach((key) => {
    try {
      doc.setMetaData(key, '');
    } catch (err) {
      // Some documents expose read-only or absent metadata keys.
    }
  });
}

// Convert a PNG Uint8Array to JPEG ArrayBuffer using OffscreenCanvas
async function pngToJpeg(pngBytes: Uint8Array, quality: number): Promise<ArrayBuffer> {
  const blob = new Blob([pngBytes as any], { type: 'image/png' });
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Failed to get 2D OffscreenCanvas context');
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 });
  return await jpegBlob.arrayBuffer();
}

/** Formats MuPDF embeds directly, so the bytes are passed through untouched. */
const MUPDF_NATIVE_FORMATS: ReadonlySet<RasterFormat> = new Set([
  'png',
  'jpeg',
  'gif',
  'bmp',
  'tiff',
]);

/** Formats browsers can render in an <img>, so the preview needs no conversion. */
const BROWSER_RENDERABLE_FORMATS: ReadonlySet<RasterFormat> = new Set([
  'png',
  'jpeg',
  'gif',
  'bmp',
  'webp',
]);

/** Copies out of the WASM heap so the result can be transferred to the main thread. */
function sliceToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/**
 * Decodes with the browser and re-encodes as PNG. Needed for WebP, which MuPDF
 * has no decoder for.
 */
async function browserEncodePng(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ArrayBuffer> {
  let bitmap;
  try {
    bitmap = await createImageBitmap(new Blob([buffer]));
  } catch {
    throw new Error(
      `"${fileName}" could not be decoded. Supported image formats are PNG, JPEG, WebP, GIF, TIFF, and BMP.`
    );
  }

  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D OffscreenCanvas context');
    ctx.drawImage(bitmap, 0, 0);
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
    return await pngBlob.arrayBuffer();
  } finally {
    bitmap.close();
  }
}

/**
 * Renders via MuPDF to PNG. Needed for TIFF, which browsers cannot display, so
 * the preview grid would otherwise have nothing to show.
 */
function muPdfEncodePng(image: any): ArrayBuffer {
  const pixmap = image.toPixmap();
  try {
    return sliceToArrayBuffer(pixmap.asPNG());
  } finally {
    safeDestroy(pixmap);
  }
}

const MIME_BY_FORMAT: Record<RasterFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  webp: 'image/png',
  unknown: 'image/png',
};

/**
 * Custom helper to create a page with an image.
 * This directly constructs the resources dictionary and contents stream
 * in compliance with the core MuPDF.js API.
 */
function insertPageWithImage(doc: any, atIndex: number, imageBuffer: ArrayBuffer, width: number, height: number) {
  const img = new (mupdf as any).Image(imageBuffer);
  let imgObj;
  try {
    imgObj = doc.addImage(img);
  } finally {
    safeDestroy(img);
  }

  // Create resources dictionary mapping "/Img" to the image object
  const resources = doc.newDictionary();
  const xobjectDict = doc.newDictionary();
  xobjectDict.put('Img', imgObj);
  resources.put('XObject', xobjectDict);

  // Contents stream: scale by width and height, then draw "/Img"
  const contents = `q ${width} 0 0 ${height} 0 0 cm /Img Do Q`;

  // Create page and insert into document
  const pageObj = doc.addPage([0, 0, width, height], 0, resources, contents);
  doc.insertPage(atIndex, pageObj);
}

/**
 * Standard paper sizes in PDF points (1/72 inch). Sizes differ from `pxToPt`
 * because they are physical dimensions, not image pixels.
 */
const PAGE_PRESETS: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

/** Scales an image pixel dimension into points at 96 DPI (1px = 0.75pt). */
function pxToPt(px: number): number {
  return px * 0.75;
}

/**
 * Adds one page and draws the image on it.
 *
 * `original` sizes the page to the image's natural size (the previous default).
 * Any preset sizes the page to the paper and draws the image with a "contain"
 * fit, centred — so a portrait photo sits inside an A4 sheet instead of being
 * stretched to it. Orientation only matters for presets: `auto` follows the
 * image, `portrait`/`landscape` force the sheet.
 */
function insertImagePage(
  doc: any,
  atIndex: number,
  imageBuffer: ArrayBuffer,
  imageWidthPx: number,
  imageHeightPx: number,
  pageSize: string,
  orientation: string
) {
  const iw = pxToPt(imageWidthPx);
  const ih = pxToPt(imageHeightPx);

  let pw: number;
  let ph: number;
  let fitScale = 1;
  let tx = 0;
  let ty = 0;

  if (pageSize === 'original') {
    pw = iw;
    ph = ih;
  } else {
    const preset = PAGE_PRESETS[pageSize] ?? PAGE_PRESETS.a4;
    const landscape =
      orientation === 'landscape' ||
      (orientation === 'auto' && imageWidthPx > imageHeightPx);
    pw = landscape ? Math.max(preset.width, preset.height) : Math.min(preset.width, preset.height);
    ph = landscape ? Math.min(preset.width, preset.height) : Math.max(preset.width, preset.height);

    fitScale = Math.min(pw / iw, ph / ih);
    tx = (pw - iw * fitScale) / 2;
    ty = (ph - ih * fitScale) / 2;
  }

  const img = new (mupdf as any).Image(imageBuffer);
  let imgObj;
  try {
    imgObj = doc.addImage(img);
  } finally {
    safeDestroy(img);
  }

  const resources = doc.newDictionary();
  const xobjectDict = doc.newDictionary();
  xobjectDict.put('Img', imgObj);
  resources.put('XObject', xobjectDict);

  const dw = iw * fitScale;
  const dh = ih * fitScale;
  // PDF content-stream coordinates have their origin at the bottom-left, so
  // the offset centres the (possibly scaled) image on the page.
  const contents = `q ${dw} 0 0 ${dh} ${tx} ${ty} cm /Img Do Q`;

  const pageObj = doc.addPage([0, 0, pw, ph], 0, resources, contents);
  doc.insertPage(atIndex, pageObj);
}

interface WatermarkPayloadSpec {
  kind: 'text' | 'image';
  text: string;
  fontSizePt: number;
  color: string;
  imageBuffer?: ArrayBuffer; // present for image mode
  sizePct: number;
  opacity: number;
  rotation: number;
  position: 'tiled' | 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Rasterises one page's PNG, draws the watermark with the shared function, and
 * re-encodes as JPEG for `insertPageWithImage`. `scale` (px per point) is the
 * raster DPI ÷ 72, so the point-based font size maps to the rendered pixels.
 */
async function watermarkPagePixmap(
  pngBytes: Uint8Array,
  drawSpec: { kind: 'text' | 'image'; text: string; fontSizePt: number; color: string; image: CanvasImageSource | null; sizePct: number; opacity: number; rotation: number; position: WatermarkPayloadSpec['position'] },
  scale: number
): Promise<ArrayBuffer> {
  const blob = new Blob([pngBytes as any], { type: 'image/png' });
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D OffscreenCanvas context');
    ctx.drawImage(bitmap, 0, 0);
    drawWatermark(ctx, drawSpec as any, canvas.width, canvas.height, scale);
    const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
    return await jpegBlob.arrayBuffer();
  } finally {
    bitmap.close();
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'MERGE_SPLIT_ROTATE') {
      const { files, pages } = payload;
      
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 10, message: 'Opening PDF documents...' } });
      
      const srcDocs: any[] = [];
      try {
        for (const file of files) {
          const doc = (mupdf as any).Document.openDocument(file.buffer, 'application/pdf');
          srcDocs.push(doc.isPDF() ? doc : doc);
        }

        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 35, message: 'Grafting pages...' } });
        const outDoc = new (mupdf as any).PDFDocument();
        
        try {
          // Build a mapping: for each source doc, record the starting index in outDoc
          const offsets: number[] = [];
          let currentOffset = 0;
          
          for (let i = 0; i < srcDocs.length; i++) {
            offsets.push(currentOffset);
            const srcDoc = srcDocs[i];
            const numSrcPages = srcDoc.countPages();
            // Graft each page individually from source into outDoc
            for (let p = 0; p < numSrcPages; p++) {
              outDoc.graftPage(currentOffset + p, srcDoc, p);
            }
            currentOffset += numSrcPages;
          }

          self.postMessage({ id, type: 'PROGRESS', payload: { progress: 60, message: 'Reordering page sequence...' } });
          const targetIndices = pages.map((p: any) => {
            return offsets[p.fileIndex] + p.pageIndex;
          });

          // This keeps only target pages in requested order
          outDoc.rearrangePages(targetIndices);

          self.postMessage({ id, type: 'PROGRESS', payload: { progress: 80, message: 'Applying page rotations...' } });
          for (let i = 0; i < pages.length; i++) {
            const rot = pages[i].rotation;
            if (rot !== 0) {
              // Set rotation via the PDF page dictionary object
              const pageObj = outDoc.findPage(i);
              const currentRot = pageObj.get("Rotate")?.asNumber?.() || 0;
              pageObj.put("Rotate", outDoc.newInteger((currentRot + rot) % 360));
            }
          }

          self.postMessage({ id, type: 'PROGRESS', payload: { progress: 90, message: 'Compiling final PDF...' } });
          const outBuffer = outDoc.saveToBuffer('compress,compress-images,garbage=2');
          const transferBuffer = copyPdfBuffer(outBuffer);
          (self as any).postMessage({
            id,
            type: 'SUCCESS',
            payload: { buffer: transferBuffer }
          }, [transferBuffer]);
        } finally {
          safeDestroy(outDoc);
        }
      } finally {
        srcDocs.forEach(safeDestroy);
      }

    } else if (type === 'COMPRESS_LIGHT') {
      const { buffer } = payload;
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 20, message: 'Reading document...' } });
      
      const doc = (mupdf as any).Document.openDocument(buffer, 'application/pdf');
      try {
        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 50, message: 'Stripping document metadata...' } });
        
        scrubPdfMetadata(doc);

        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 80, message: 'Optimizing and deduplicating objects...' } });
        const outBuffer = doc.saveToBuffer('compress,compress-images,garbage=2');
        const transferBuffer = copyPdfBuffer(outBuffer);
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: { buffer: transferBuffer }
        }, [transferBuffer]);
      } finally {
        safeDestroy(doc);
      }

    } else if (type === 'STRIP_PDF_METADATA') {
      const { buffer } = payload;
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 20, message: 'Reading PDF metadata...' } });

      const doc = (mupdf as any).Document.openDocument(buffer, 'application/pdf');
      try {
        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 55, message: 'Removing common document info fields...' } });
        scrubPdfMetadata(doc);

        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 85, message: 'Saving privacy-scrubbed PDF...' } });
        const outBuffer = doc.saveToBuffer('compress,compress-images,garbage=2');
        const transferBuffer = copyPdfBuffer(outBuffer);
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: { buffer: transferBuffer }
        }, [transferBuffer]);
      } finally {
        safeDestroy(doc);
      }

    } else if (type === 'COMPRESS_DEEP') {
      const { buffer, quality, dpi } = payload;
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 5, message: 'Reading document...' } });
      
      const doc = (mupdf as any).Document.openDocument(buffer, 'application/pdf');
      const outDoc = new (mupdf as any).PDFDocument();
      
      try {
        const numPages = doc.countPages();
        const tooMany = tooManyPages(numPages);
        if (tooMany) throw tooMany;
        const scale = dpi / 72; // MuPDF rendering matrix scale factor (72 points = 1 inch)
        
        for (let i = 0; i < numPages; i++) {
          const pagePct = Math.round((i / numPages) * 80);
          self.postMessage({ 
            id, 
            type: 'PROGRESS', 
            payload: { progress: 10 + pagePct, message: `Rasterizing page ${i + 1} of ${numPages}...` } 
          });
          
          let page;
          let pixmap;
          try {
            page = doc.loadPage(i);
            const bounds = page.getBounds();
            const width = bounds[2] - bounds[0];
            const height = bounds[3] - bounds[1];

            // Render page to Pixmap (scale, colorspace, alpha, ignore-annotations)
            pixmap = page.toPixmap((mupdf as any).Matrix.scale(scale, scale), (mupdf as any).ColorSpace.DeviceRGB, false, true);
            const pngBytes = pixmap.asPNG();

            // Compress PNG output to low-quality JPEG
            const jpegBuffer = await pngToJpeg(pngBytes, quality);

            // Insert page with compressed image
            insertPageWithImage(outDoc, i, jpegBuffer, width, height);
          } finally {
            safeDestroy(page);
            safeDestroy(pixmap);
          }
        }
        
        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 90, message: 'Compressing and optimizing document objects...' } });
        const outBuffer = outDoc.saveToBuffer('compress,compress-images,garbage=2');
        const transferBuffer = copyPdfBuffer(outBuffer);
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: { buffer: transferBuffer }
        }, [transferBuffer]);
      } finally {
        safeDestroy(doc);
        safeDestroy(outDoc);
      }

    } else if (type === 'PDF_TO_IMAGE') {
      const { buffer, format, quality, scale } = payload;
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 10, message: 'Reading PDF pages...' } });
      
      const doc = (mupdf as any).Document.openDocument(buffer, 'application/pdf');
      try {
        const numPages = doc.countPages();
        const tooMany = tooManyPages(numPages);
        if (tooMany) throw tooMany;
        const results = [];
        const isJpeg = format === 'image/jpeg';
        
        for (let i = 0; i < numPages; i++) {
          const pagePct = Math.round((i / numPages) * 80);
          self.postMessage({ 
            id, 
            type: 'PROGRESS', 
            payload: { progress: 10 + pagePct, message: `Converting page ${i + 1} of ${numPages}...` } 
          });
          
          let page;
          let pixmap;
          try {
            page = doc.loadPage(i);
            pixmap = page.toPixmap((mupdf as any).Matrix.scale(scale, scale), (mupdf as any).ColorSpace.DeviceRGB, false, true);
            let imgBytes = pixmap.asPNG();

            if (isJpeg) {
              const jpegBuffer = await pngToJpeg(imgBytes, quality);
              imgBytes = new Uint8Array(jpegBuffer);
            }

            // Slice the Uint8Array buffer to prevent keeping references
            const singleBuffer = imgBytes.buffer.slice(imgBytes.byteOffset, imgBytes.byteOffset + imgBytes.byteLength);
            results.push({
              pageIndex: i,
              buffer: singleBuffer
            });
          } finally {
            safeDestroy(page);
            safeDestroy(pixmap);
          }
        }
        
        const transferBuffers = results.map(r => r.buffer);
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: { images: results }
        }, transferBuffers);
      } finally {
        safeDestroy(doc);
      }

    } else if (type === 'PREPARE_IMAGES') {
      const { images } = payload;
      const prepared: any[] = [];

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        self.postMessage({
          id,
          type: 'PROGRESS',
          payload: {
            progress: Math.round((i / images.length) * 95),
            message: `Reading image ${i + 1} of ${images.length}...`
          }
        });

        const format = sniffImageFormat(item.buffer);

        // Embed buffer: MuPDF takes these as-is; WebP must be re-encoded first
        // because MuPDF has no WebP decoder.
        const embedBuffer = MUPDF_NATIVE_FORMATS.has(format)
          ? item.buffer
          : await browserEncodePng(item.buffer, item.name);

        // Measure via MuPDF so every format reports dimensions identically,
        // including TIFF, which browsers cannot decode.
        const img = new (mupdf as any).Image(embedBuffer);
        let width;
        let height;
        let previewBuffer: ArrayBuffer | null = null;
        try {
          width = img.getWidth();
          height = img.getHeight();

          // TIFF can't be shown in an <img>, so MuPDF renders the thumbnail.
          if (!BROWSER_RENDERABLE_FORMATS.has(format)) {
            previewBuffer = muPdfEncodePng(img);
          }
        } finally {
          safeDestroy(img);
        }

        prepared.push({
          id: item.id,
          name: item.name,
          size: item.size,
          mimeType: MIME_BY_FORMAT[format],
          buffer: embedBuffer,
          previewBuffer,
          previewMimeType: previewBuffer ? 'image/png' : null,
          width,
          height,
        });
      }

      const transferBuffers = prepared.flatMap((p) =>
        p.previewBuffer ? [p.buffer, p.previewBuffer] : [p.buffer]
      );
      (self as any).postMessage(
        { id, type: 'SUCCESS', payload: { images: prepared } },
        transferBuffers
      );

    } else if (type === 'IMAGE_TO_PDF') {
      const { images, pageSize = 'original', orientation = 'auto' } = payload;
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 10, message: 'Initializing PDF...' } });
      
      const outDoc = new (mupdf as any).PDFDocument();
      try {
        for (let i = 0; i < images.length; i++) {
          const imgData = images[i];
          const pagePct = Math.round((i / images.length) * 75);
          self.postMessage({ 
            id, 
            type: 'PROGRESS', 
            payload: { progress: 15 + pagePct, message: `Compiling image ${i + 1} of ${images.length}...` } 
          });
          
          insertImagePage(
            outDoc,
            i,
            imgData.buffer,
            imgData.width,
            imgData.height,
            pageSize,
            orientation
          );
        }
        
        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 90, message: 'Creating PDF file...' } });
        const outBuffer = outDoc.saveToBuffer('compress,compress-images,garbage=2');
        const transferBuffer = copyPdfBuffer(outBuffer);
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: { buffer: transferBuffer }
        }, [transferBuffer]);
      } finally {
        safeDestroy(outDoc);
      }

    } else if (type === 'WATERMARK_PDF') {
      const { buffer, spec } = payload as { buffer: ArrayBuffer; spec: WatermarkPayloadSpec };
      self.postMessage({ id, type: 'PROGRESS', payload: { progress: 5, message: 'Reading document…' } });

      // Decode the logo once, up front, so every page reuses the same bitmap.
      const imageBitmap =
        spec.kind === 'image' && spec.imageBuffer
          ? await createImageBitmap(new Blob([spec.imageBuffer]))
          : null;

      const drawSpec = {
        kind: spec.kind,
        text: spec.text,
        fontSizePt: spec.fontSizePt,
        color: spec.color,
        image: imageBitmap,
        sizePct: spec.sizePct,
        opacity: spec.opacity,
        rotation: spec.rotation,
        position: spec.position,
      };

      const doc = (mupdf as any).Document.openDocument(buffer, 'application/pdf');
      const outDoc = new (mupdf as any).PDFDocument();
      try {
        const numPages = doc.countPages();
        const tooMany = tooManyPages(numPages);
        if (tooMany) throw tooMany;
        // Fixed 150 DPI keeps output readable without bloating file size.
        const scale = 150 / 72;

        for (let i = 0; i < numPages; i++) {
          const pagePct = Math.round((i / numPages) * 80);
          self.postMessage({
            id,
            type: 'PROGRESS',
            payload: { progress: 10 + pagePct, message: `Watermarking page ${i + 1} of ${numPages}…` }
          });

          let page;
          let pixmap;
          try {
            page = doc.loadPage(i);
            const bounds = page.getBounds();
            const width = bounds[2] - bounds[0];
            const height = bounds[3] - bounds[1];

            pixmap = page.toPixmap(
              (mupdf as any).Matrix.scale(scale, scale),
              (mupdf as any).ColorSpace.DeviceRGB,
              false,
              true
            );
            const pngBytes = pixmap.asPNG();

            const jpegBuffer = await watermarkPagePixmap(pngBytes, drawSpec, scale);
            insertPageWithImage(outDoc, i, jpegBuffer, width, height);
          } finally {
            safeDestroy(page);
            safeDestroy(pixmap);
          }
        }

        self.postMessage({ id, type: 'PROGRESS', payload: { progress: 90, message: 'Compiling watermarked PDF…' } });
        const outBuffer = outDoc.saveToBuffer('compress,compress-images,garbage=2');
        const transferBuffer = copyPdfBuffer(outBuffer);
        (self as any).postMessage({
          id,
          type: 'SUCCESS',
          payload: { buffer: transferBuffer }
        }, [transferBuffer]);
      } finally {
        safeDestroy(doc);
        safeDestroy(outDoc);
        if (imageBitmap) imageBitmap.close();
      }

    } else {
      throw new Error(`Unsupported message type: ${type}`);
    }
  } catch (error: any) {
    self.postMessage({
      id,
      type: 'ERROR',
      payload: { message: error?.message || 'PDF worker processing failed.' }
    });
  }
};

// Signals that this module (including the MuPDF WASM import, which uses
// top-level await) has finished evaluating and the handler above is installed.
// Anything the main thread posts before this point would be dispatched with no
// listener and lost, so `useWorker` holds requests until READY arrives.
self.postMessage({ id: '__ready__', type: 'READY', payload: {} });
