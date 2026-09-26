export interface TextLine {
  text: string;
  fontSize: number; // approx., from the first item's transform scale
  y: number; // vertical position, for ordering
}

export interface PdfTextPage {
  index: number;
  lines: TextLine[];
}

export interface PdfText {
  pageCount: number;
  pages: PdfTextPage[];
}

/**
 * pdfjs-dist references browser-only globals (DOMMatrix), so it must be loaded
 * lazily inside a function — a static top-level import is evaluated during SSR
 * prerender and crashes the build (same reason lib/pdf-utils.ts does this).
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
 * Extracts text page-by-page with pdfjs and clusters flat items into
 * reading-order lines by y position. pdfjs returns items with transforms and
 * includes trailing spaces in `str`, so joining items on a shared y-row with
 * '' preserves word spacing. Layout is not preserved — this is a text extract,
 * not a renderer.
 */
export async function extractPdfText(data: ArrayBuffer): Promise<PdfText> {
  const pdfjsLib = await getPdfjsLib();
  // Slice defensively like lib/pdf-utils.ts, and destroy the document after
  // extraction so the main thread doesn't leak the pdfjs instance.
  const loadingTask = pdfjsLib.getDocument({ data: data.slice(0) });
  const pdf = await loadingTask.promise;
  try {
    const pages: PdfTextPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const rows = new Map<number, { text: string; fontSize: number; x: number }[]>();
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const it = item as { str: string; transform: number[] };
        const str = it.str;
        if (!str.trim()) continue;
        const y = it.transform[5];
        const x = it.transform[4];
        const fontSize = Math.hypot(it.transform[2], it.transform[3]) || 12;
        const key = Math.round(y);
        const bucket = rows.get(key) ?? [];
        bucket.push({ text: str, fontSize, x });
        rows.set(key, bucket);
      }

      const lines: TextLine[] = [...rows.entries()]
        // PDF y grows upward (higher = nearer the top), so a descending sort
        // yields top-to-bottom reading order.
        .sort((a, b) => b[0] - a[0])
        .map(([y, items]) => {
          const ordered = items.sort((a, b) => a.x - b.x);
          return {
            y,
            fontSize: Math.max(...ordered.map((i) => i.fontSize)),
            text: ordered.map((i) => i.text).join(''),
          };
        });

      pages.push({ index: i - 1, lines });
    }

    return { pageCount: pdf.numPages, pages };
  } finally {
    await pdf.cleanup();
    await loadingTask.destroy();
  }
}
