/**
 * PDF utility functions using pdfjs-dist.
 * Uses dynamic import() to avoid loading pdfjs-dist on the server,
 * which would fail because pdfjs-dist references browser-only globals (DOMMatrix).
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

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
  try {
    return pdf.numPages;
  } finally {
    await pdf.cleanup();
    await loadingTask.destroy();
  }
}

/**
 * Renders a specific page of a PDF buffer onto an offscreen canvas and returns a JPEG Data URL
 */
export async function renderPdfPageToDataUrl(
  buffer: ArrayBuffer,
  pageNum: number,
  scale = 0.35
): Promise<string> {
  const [dataUrl] = await renderPdfPagesToDataUrls(buffer, [pageNum], scale);
  return dataUrl;
}

/**
 * Renders multiple PDF pages after opening the document once.
 */
export async function renderPdfPagesToDataUrls(
  buffer: ArrayBuffer,
  pageNumbers: number[],
  scale = 0.35,
  onProgress?: (currentPage: number, totalPages: number) => void
): Promise<string[]> {
  const pdfjsLib = await getPdfjsLib();
  const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
  const pdf = await loadingTask.promise;

  try {
    const dataUrls: string[] = [];

    for (let index = 0; index < pageNumbers.length; index++) {
      const pageNum = pageNumbers[index];
      onProgress?.(index + 1, pageNumbers.length);

      const page = await pdf.getPage(pageNum);
      try {
        dataUrls.push(await renderPageToJpeg(page, scale));
      } finally {
        page.cleanup();
      }
    }

    return dataUrls;
  } finally {
    await pdf.cleanup();
    await loadingTask.destroy();
  }
}

/**
 * Opens a PDF and keeps it open, for tools that page through one document: a
 * page turn then renders from the parsed document instead of copying and
 * re-parsing the whole file. The caller owns it and must call `pdf.loadingTask.destroy()`.
 */
export async function openPdfDocument(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjsLib = await getPdfjsLib();
  // pdfjs transfers the bytes to its worker, so give it a copy and keep ours.
  return pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
}

/**
 * Renders one page of an open document and also reports its displayed size in
 * PDF points (after /Rotate, top-left origin). Callers that position things on
 * the page need the exact size: inferring it from the canvas would be off by
 * the pixel rounding.
 */
export async function renderPdfDocumentPage(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale: number
): Promise<{ dataUrl: string; widthPt: number; heightPt: number }> {
  const page = await pdf.getPage(pageNum);
  try {
    const { width, height } = page.getViewport({ scale: 1 });
    return { dataUrl: await renderPageToJpeg(page, scale), widthPt: width, heightPt: height };
  } finally {
    page.cleanup();
  }
}

async function renderPageToJpeg(
  page: PDFPageProxy,
  scale: number
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  await page.render({
    canvas,
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}
