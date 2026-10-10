'use client';

/* eslint-disable @next/next/no-img-element -- page previews are data URLs */
import { useCallback, useEffect, useRef, useState } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { NotePanel } from '@/components/tools/note-panel';
import { PanelActions, PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { SignaturePad, type SignatureImage } from '@/components/tools/signature-pad';
import { PlacementBox, clampBox, type PageBox } from '@/components/tools/placement-box';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { openPdfDocument, renderPdfDocumentPage } from '@/lib/pdf-utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const tool = requireTool('pdf-sign');

/** Rendered above display size so the preview stays sharp on high-DPI screens. */
const PREVIEW_SCALE = 1.5;
/** A new signature starts at a quarter of the page width, capped at ~2.8 in. */
const DEFAULT_WIDTH_FRACTION = 0.25;
const DEFAULT_MAX_WIDTH_PT = 200;
/** Uploaded signature images are capped so a phone photo doesn't become a 4 MB stamp. */
const MAX_SIGNATURE_PX = 1200;

/** `pdf` stays open while the file is loaded so page turns don't re-parse it. */
interface PdfFile { name: string; buffer: ArrayBuffer; pdf: PDFDocumentProxy; pageCount: number; }
interface PagePreview { index: number; dataUrl: string; widthPt: number; heightPt: number; }
interface Signature { png: ArrayBuffer; url: string; aspect: number; }
interface Placement extends PageBox { id: number; page: number; }
interface Signed { name: string; blobUrl: string; }

export default function PdfSignPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  // Uploaded signature images are decoded and cleaned up off the main thread.
  const createImageWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask: postImageTask } = useWorker(createImageWorker);
  const prepareUpload = useCallback(
    async (buffer: ArrayBuffer, removePaper: boolean): Promise<SignatureImage> => {
      const res = await postImageTask<
        { buffer: ArrayBuffer; removePaper: boolean; maxPx: number },
        { buffer: ArrayBuffer; aspect: number }
      >('PREPARE_SIGNATURE', { buffer: buffer.slice(0), removePaper, maxPx: MAX_SIGNATURE_PX });
      return { blob: new Blob([res.buffer], { type: 'image/png' }), aspect: res.aspect };
    },
    [postImageTask]
  );

  const [file, setFile] = useState<PdfFile | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [preview, setPreview] = useState<PagePreview | null>(null);
  const [pageSizes, setPageSizes] = useState<Record<number, { widthPt: number; heightPt: number }>>({});
  const [signature, setSignature] = useState<Signature | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [result, setResult] = useState<Signed | null>(null);
  const nextId = useRef(1);

  // Display scale is measured, not computed from a breakpoint, so it is right at
  // every width the image happens to lay out at.
  const imageRef = useRef<HTMLImageElement>(null);
  const [displayScale, setDisplayScale] = useState(0);
  useEffect(() => {
    const img = imageRef.current;
    if (!img || !preview) return;
    const measure = () => setDisplayScale(img.clientWidth / preview.widthPt);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(img);
    return () => observer.disconnect();
  }, [preview]);

  useEffect(() => () => { if (signature) URL.revokeObjectURL(signature.url); }, [signature]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.blobUrl); }, [result]);
  useEffect(() => () => { void file?.pdf.loadingTask.destroy(); }, [file]);

  // Render the current page whenever it changes. This isn't routed through
  // runTask: a full-screen overlay on every page turn would be noise, but a
  // failure still has to reach the user, so it gets its own banner.
  // Keyed by page so turning to another page hides a stale error without a reset.
  const [previewError, setPreviewError] = useState<{ page: number; message: string } | null>(null);
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    renderPdfDocumentPage(file.pdf, pageIndex + 1, PREVIEW_SCALE)
      .then(({ dataUrl, widthPt, heightPt }) => {
        if (cancelled) return;
        setPreview({ index: pageIndex, dataUrl, widthPt, heightPt });
        setPageSizes((prev) => ({ ...prev, [pageIndex]: { widthPt, heightPt } }));
        // A page that renders now must not keep showing an earlier failure.
        setPreviewError(null);
      })
      .catch(() => { if (!cancelled) setPreviewError({ page: pageIndex, message: `Could not render page ${pageIndex + 1} of this PDF.` }); });
    return () => { cancelled = true; };
  }, [file, pageIndex]);

  const handleFilesSelected = async (selected: File[]) => {
    if (selected.length === 0) return;
    setResult(null);
    const target = selected[0];
    const loaded = await task.runTask(
      async () => {
        const buffer = await target.arrayBuffer();
        // Opening it here also proves pdfjs can read it, so an encrypted or
        // broken file fails with a clear message instead of in the preview.
        const pdf = await openPdfDocument(buffer);
        return { name: target.name, buffer, pdf, pageCount: pdf.numPages };
      },
      {
        initialMessage: 'Reading document…',
        errorMessage: 'Could not read this PDF. If it is password-protected, unlock it first.',
      }
    );
    if (loaded.ok) {
      setFile(loaded.value);
      setPageIndex(0);
      setPreview(null);
      setPageSizes({});
      setPlacements([]);
      setPreviewError(null);
    }
  };

  // Each change gets a sequence number; reading the PNG is async, and an older
  // change finishing after a newer one must not win.
  const signatureSeq = useRef(0);
  const handleSignatureChange = useCallback(async (next: SignatureImage | null) => {
    const seq = ++signatureSeq.current;
    if (!next) {
      setSignature(null);
      return;
    }
    const png = await next.blob.arrayBuffer();
    if (seq !== signatureSeq.current) return;
    setSignature({ png, url: URL.createObjectURL(next.blob), aspect: next.aspect });
    // Existing placements keep their width and position and take the new shape.
    setPlacements((prev) =>
      prev.map((p) => {
        const size = pageSizes[p.page];
        const resized = { ...p, height: p.width / next.aspect };
        return size ? { ...p, ...clampBox(resized, size.widthPt, size.heightPt, next.aspect) } : resized;
      })
    );
  }, [pageSizes]);

  // The pager label moves before the next page finishes rendering, so placing
  // is only allowed once the preview shows the page the label names.
  const previewReady = preview !== null && preview.index === pageIndex;

  const addToPage = () => {
    if (!signature || !preview || !previewReady) return;
    const width = Math.min(preview.widthPt * DEFAULT_WIDTH_FRACTION, DEFAULT_MAX_WIDTH_PT);
    const height = width / signature.aspect;
    const box = clampBox(
      { x: (preview.widthPt - width) / 2, y: (preview.heightPt - height) / 2, width, height },
      preview.widthPt,
      preview.heightPt,
      signature.aspect
    );
    setPlacements((prev) => [...prev, { id: nextId.current++, page: preview.index, ...box }]);
  };

  const updatePlacement = (id: number, update: (prev: PageBox) => PageBox) =>
    setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, ...update(p) } : p)));
  const removePlacement = (id: number) => setPlacements((prev) => prev.filter((p) => p.id !== id));

  const handleSign = async () => {
    if (!file || !signature || placements.length === 0) return;
    const outcome = await task.runTask(
      async (report) => {
        const response = await postTask<
          { buffer: ArrayBuffer; signature: ArrayBuffer; placements: Omit<Placement, 'id'>[] },
          { buffer: ArrayBuffer }
        >(
          'SIGN_PDF',
          {
            buffer: file.buffer.slice(0),
            signature: signature.png.slice(0),
            placements: placements.map(({ page, x, y, width, height }) => ({ page, x, y, width, height })),
          },
          (progress, message) => report(progress, message)
        );
        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return { name: `signed_${file.name}`, blobUrl: URL.createObjectURL(blob) };
      },
      { initialMessage: 'Signing document…', errorMessage: 'Could not sign this PDF.' }
    );
    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => {
    setFile(null);
    setPreview(null);
    setPlacements([]);
    setResult(null);
    task.reset();
  };

  const pagePlacements = preview ? placements.filter((p) => p.page === preview.index) : [];
  const pageCount = file?.pageCount ?? 0;

  return (
    <ToolPageShell title={tool.title} description={tool.description} icon={tool.icon} category={tool.category}>
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to sign"
          />
        </div>
      ) : !result ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <TaskErrorBanner message={previewError?.page === pageIndex ? previewError.message : null} onDismiss={() => setPreviewError(null)} />
          <div className="grid gap-6 md:grid-cols-3">
            {/* Page preview with placed signatures */}
            <div className="flex min-w-0 flex-col gap-4 md:col-span-2">
              <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                <h2 className="truncate text-sm font-bold font-manrope">{file.name}</h2>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Previous page"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                    className="[@media(pointer:coarse)]:size-11"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden />
                  </Button>
                  <span className="min-w-20 text-center text-xs text-muted-foreground font-dm-sans" aria-live="polite">
                    Page {pageIndex + 1} of {pageCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Next page"
                    disabled={pageIndex >= pageCount - 1}
                    onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
                    className="[@media(pointer:coarse)]:size-11"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>

              {/* Extra padding leaves room for the corner handles at the page edge. */}
              <div className="flex justify-center rounded-2xl border border-border/60 bg-muted/5 p-5 sm:p-6">
                {preview ? (
                  <div className="relative inline-block max-w-full">
                    <img
                      ref={imageRef}
                      src={preview.dataUrl}
                      alt={`Page ${preview.index + 1} preview`}
                      draggable={false}
                      className="block max-h-[70vh] w-auto max-w-full select-none rounded-sm shadow-sm"
                    />
                    {signature && displayScale > 0 &&
                      pagePlacements.map((p, i) => (
                        <PlacementBox
                          key={p.id}
                          box={p}
                          pageWidth={preview.widthPt}
                          pageHeight={preview.heightPt}
                          scale={displayScale}
                          imageUrl={signature.url}
                          aspect={signature.aspect}
                          label={`Signature ${i + 1} on page ${preview.index + 1}`}
                          onChange={(update) => updatePlacement(p.id, update)}
                          onRemove={() => removePlacement(p.id)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="aspect-[3/4] w-full max-w-sm animate-pulse rounded-sm bg-muted" aria-label="Loading page preview" />
                )}
              </div>
            </div>

            {/* Signature + actions */}
            <ToolPanel title="Your signature" sticky>
              <SignaturePad onChange={handleSignatureChange} prepareUpload={prepareUpload} />

              <Button
                variant="outline"
                onClick={addToPage}
                disabled={!signature || !previewReady}
                className="w-full py-5 text-xs font-semibold"
              >
                <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" aria-hidden />
                Add to this page
              </Button>

              {placements.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold font-dm-sans">Placed ({placements.length})</h3>
                  <ul className="flex flex-col gap-1">
                    {placements.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-xs font-dm-sans">
                        <button
                          type="button"
                          onClick={() => setPageIndex(p.page)}
                          className="text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:min-h-11"
                        >
                          Page {p.page + 1}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePlacement(p.id)}
                          className="font-semibold text-muted-foreground hover:text-destructive [@media(pointer:coarse)]:min-h-11"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <NotePanel className="p-4">
                <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                  This adds a visual signature, not a certificate-based digital signature. Your file and
                  signature never leave this browser.
                </p>
              </NotePanel>

              <PanelActions>
                <PanelPrimaryAction
                  category={tool.category}
                  onClick={handleSign}
                  disabled={task.isProcessing || !signature || placements.length === 0}
                >
                  {task.isProcessing ? 'Signing…' : 'Sign PDF'}
                </PanelPrimaryAction>
                <PanelSecondaryAction onClick={clearWorkspace} disabled={task.isProcessing}>
                  Change File
                </PanelSecondaryAction>
              </PanelActions>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="PDF Signed"
          description={`Signature placed ${placements.length} ${placements.length === 1 ? 'time' : 'times'}. The rest of the document is unchanged.`}
          actions={
            <>
              <Button variant="outline" onClick={clearWorkspace} className="flex-1 py-5 text-xs font-semibold">
                Start Over
              </Button>
              <Button asChild className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.category].button}`}>
                <a href={result.blobUrl} download={result.name}>
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                  Download PDF
                </a>
              </Button>
            </>
          }
        />
      )}
      {task.isProcessing && <ProcessingOverlay category={tool.category} message={task.message} progress={task.progress} />}
    </ToolPageShell>
  );
}
