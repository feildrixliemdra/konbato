/** Where an engine executes. The distinction is the point of the section. */
export type ExecutionLane = 'Worker' | 'Main thread';

export interface Engine {
  name: string;
  /**
   * The package or browser API this engine is.
   *
   * `tests/engine-map.spec.ts` asserts a `Worker` engine appears inside its
   * declared worker modules and a `Main thread` engine appears in no worker at
   * all, so the published lane cannot drift away from the code.
   */
  source: string;
  runtime: string;
  lane: ExecutionLane;
  /** Worker modules that run this engine. `null` for a main-thread engine. */
  workers: string[] | null;
  /** What the engine contributes, shown in the table. */
  role: string;
  /**
   * Slugs of the tools that depend on this engine.
   *
   * Not rendered anywhere: the table states what each engine does rather than
   * re-listing tools that are linked all over the rest of the page. They are
   * kept because the engine map test asserts the lane claim against the tool
   * pages, and it needs to know which pages to check.
   *
   * Deliberately a plain string array, and this module deliberately imports
   * nothing. `lib/tools.ts` pulls in an ESM-only icon package, which cannot be
   * loaded by the Playwright runner, so the registry stays dependency-free and
   * the coverage check below lives in the test.
   */
  tools: string[];
}

/**
 * The engines Konbato runs, and the lane each one runs on.
 *
 * Two execute inside a module worker and two do not. That split is stated
 * rather than rounded off, because it is the only interesting thing about the
 * list: it is why a large file does not freeze the page, and also why
 * background removal briefly can.
 */
export const ENGINES: Engine[] = [
  {
    name: 'mupdf',
    source: 'mupdf',
    runtime: 'WebAssembly',
    lane: 'Worker',
    workers: ['app/workers/pdf.worker.ts'],
    role: 'Parses PDFs, applies the page edits, and writes the file back out.',
    tools: [
      'pdf-organizer',
      'pdf-merge',
      'pdf-split',
      'pdf-rotate',
      'pdf-reorder',
      'pdf-compress',
      'pdf-metadata-remove',
      'pdf-to-image',
      'image-to-pdf',
      'pdf-watermark',
    ],
  },
  {
    name: 'OffscreenCanvas',
    source: 'OffscreenCanvas',
    runtime: 'Browser API',
    lane: 'Worker',
    workers: ['app/workers/image.worker.ts', 'app/workers/pdf.worker.ts'],
    role: 'Decodes, crops, resizes, and re-encodes JPG, PNG, and WebP.',
    tools: [
      'image-convert',
      'image-compress',
      'image-resize-crop',
      'image-metadata-remove',
      'image-to-pdf',
      'pdf-to-image',
      'pdf-watermark',
    ],
  },
  {
    name: 'pdfjs-dist',
    source: 'pdfjs-dist',
    runtime: 'JavaScript',
    lane: 'Main thread',
    workers: null,
    role: 'Rasterises page thumbnails for the previews and page pickers.',
    tools: ['pdf-organizer', 'pdf-merge', 'pdf-split', 'pdf-rotate', 'pdf-reorder'],
  },
  {
    name: '@imgly/background-removal',
    source: '@imgly/background-removal',
    runtime: 'WebAssembly (ONNX)',
    lane: 'Main thread',
    workers: null,
    role: 'Segments a subject on-device at full resolution.',
    tools: ['image-remove-bg'],
  },
];
