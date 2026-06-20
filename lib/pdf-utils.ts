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

        dataUrls.push(canvas.toDataURL('image/jpeg', 0.8));
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
