/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// @ts-ignore
import * as mupdf from 'mupdf';

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

const PDF_METADATA_LABELS: Record<string, string> = {
  'info:Title': 'Title',
  'info:Author': 'Author',
  'info:Subject': 'Subject',
  'info:Keywords': 'Keywords',
  'info:Creator': 'Creator',
  'info:Producer': 'Producer',
  'info:CreationDate': 'Creation date',
  'info:ModDate': 'Modified date',
  'info:Trapped': 'Trapped flag',
};

function scrubPdfMetadata(doc: any) {
  PDF_METADATA_KEYS.forEach((key) => {
    try {
      doc.setMetaData(key, '');
    } catch (err) {
      // Some documents expose read-only or absent metadata keys.
    }
  });
}

function readPdfMetadata(doc: any) {
  return PDF_METADATA_KEYS.flatMap((key) => {
    try {
      const value = doc.getMetaData(key);
      const normalized = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
      return normalized ? [{ key, label: PDF_METADATA_LABELS[key] || key, value: normalized }] : [];
    } catch (err) {
      return [];
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

    } else if (type === 'READ_PDF_METADATA') {
      const { buffer } = payload;
      const doc = (mupdf as any).Document.openDocument(buffer, 'application/pdf');
      try {
        self.postMessage({
          id,
          type: 'SUCCESS',
          payload: { metadata: readPdfMetadata(doc) }
        });
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
        const scale = dpi / 72; // MuPDF rendering matrix scale factor (72 points = 1 inch)
        
        for (let i = 0; i < numPages; i++) {
          const pagePct = Math.round((i / numPages) * 80);
          self.postMessage({ 
            id, 
            type: 'PROGRESS', 
            payload: { progress: 10 + pagePct, message: `Rasterizing page ${i + 1} of ${numPages}...` } 
          });
          
          const page = doc.loadPage(i);
          const bounds = page.getBounds();
          const width = bounds[2] - bounds[0];
          const height = bounds[3] - bounds[1];
          
          // Render page to Pixmap (scale, colorspace, alpha, ignore-annotations)
          const pixmap = page.toPixmap((mupdf as any).Matrix.scale(scale, scale), (mupdf as any).ColorSpace.DeviceRGB, false, true);
          const pngBytes = pixmap.asPNG();
          
          // Compress PNG output to low-quality JPEG
          const jpegBuffer = await pngToJpeg(pngBytes, quality);
          
          // Insert page with compressed image
          insertPageWithImage(outDoc, i, jpegBuffer, width, height);
          
          safeDestroy(page);
          safeDestroy(pixmap);
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
        const results = [];
        const isJpeg = format === 'image/jpeg';
        
        for (let i = 0; i < numPages; i++) {
          const pagePct = Math.round((i / numPages) * 80);
          self.postMessage({ 
            id, 
            type: 'PROGRESS', 
            payload: { progress: 10 + pagePct, message: `Converting page ${i + 1} of ${numPages}...` } 
          });
          
          const page = doc.loadPage(i);
          const pixmap = page.toPixmap((mupdf as any).Matrix.scale(scale, scale), (mupdf as any).ColorSpace.DeviceRGB, false, true);
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
          
          safeDestroy(page);
          safeDestroy(pixmap);
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

    } else if (type === 'IMAGE_TO_PDF') {
      const { images } = payload;
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
          
          // Sizing target: 1px corresponds to 0.75 points assuming standard 96 DPI screen
          const ptWidth = imgData.width * 0.75;
          const ptHeight = imgData.height * 0.75;
          
          insertPageWithImage(outDoc, i, imgData.buffer, ptWidth, ptHeight);
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
