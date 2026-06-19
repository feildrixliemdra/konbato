/**
 * PDF utility functions using pdfjs-dist.
 * Uses dynamic import() to avoid loading pdfjs-dist on the server,
 * which would fail because pdfjs-dist references browser-only globals (DOMMatrix).
 */

let _pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjsLib() {
  if (!_pdfjsLib) {
    _pdfjsLib = await import('pdfjs-dist');
    _pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
  return _pdfjsLib;
}

/**
 * Reads a PDF buffer and returns the total page count
 */
export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
  const pdfjsLib = await getPdfjsLib();
  const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  await pdf.cleanup();
  return numPages;
}

/**
 * Renders a specific page of a PDF buffer onto an offscreen canvas and returns a JPEG Data URL
 */
export async function renderPdfPageToDataUrl(
  buffer: ArrayBuffer,
  pageNum: number,
  scale = 0.35
): Promise<string> {
  const pdfjsLib = await getPdfjsLib();
  const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
  const pdf = await loadingTask.promise;
  
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    
    await page.render({
      canvas: canvas,
      canvasContext: ctx,
      viewport: viewport,
    }).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl;
  } finally {
    await pdf.cleanup();
  }
}
