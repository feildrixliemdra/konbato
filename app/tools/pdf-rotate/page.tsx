'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { PanelActions, PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { getPdfPageCount, renderPdfPagesToDataUrls } from '@/lib/pdf-utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, RotateRightIcon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';

const tool = requireTool('pdf-rotate');

interface PDFFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount: number;
}

interface PDFPageItem {
  pageIndex: number;
  thumbnailUrl: string;
  rotation: number;
}

interface PdfWorkerBufferResult {
  buffer: ArrayBuffer;
}

export default function PDFRotatePage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
      type: 'module',
    });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [rotatedBlobUrl, setRotatedBlobUrl] = useState<string>('');

  useEffect(() => {
    return () => {
      if (rotatedBlobUrl) URL.revokeObjectURL(rotatedBlobUrl);
    };
  }, [rotatedBlobUrl]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setRotatedBlobUrl('');

    const loaded = await task.runTask(
      async (report) => {
        const targetFile = selectedFiles[0];
        const buffer = await targetFile.arrayBuffer();

        report(15, 'Reading document structure…');
        const pageCount = await getPdfPageCount(buffer);

        const renderPagesCount = Math.min(pageCount, 30);
        const thumbnails = await renderPdfPagesToDataUrls(
          buffer,
          Array.from({ length: renderPagesCount }, (_, index) => index + 1),
          0.35,
          (current, total) => {
            report(15 + (current / total) * 80, `Rendering page ${current}/${total}…`);
          }
        );

        const pagesList: PDFPageItem[] = [];
        for (let p = 0; p < renderPagesCount; p++) {
          pagesList.push({ pageIndex: p, thumbnailUrl: thumbnails[p], rotation: 0 });
        }
        for (let p = renderPagesCount; p < pageCount; p++) {
          pagesList.push({ pageIndex: p, thumbnailUrl: '', rotation: 0 });
        }

        return { targetFile, buffer, pageCount, pagesList };
      },
      {
        initialMessage: 'Reading document…',
        errorMessage: 'Could not read this PDF. The file may be corrupted or password-protected.',
      }
    );

    if (!loaded.ok) return;
    const { targetFile, buffer, pageCount, pagesList } = loaded.value;

    setFile({
      name: targetFile.name,
      size: targetFile.size,
      buffer,
      pageCount,
    });
    setPages(pagesList);
  };

  const rotateIndividualPage = (pageIndex: number, degrees: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageIndex === pageIndex
          ? { ...p, rotation: (p.rotation + degrees + 360) % 360 }
          : p
      )
    );
  };

  const rotateAllPages = (degrees: number) => {
    setPages((prev) =>
      prev.map((p) => ({ ...p, rotation: (p.rotation + degrees + 360) % 360 }))
    );
  };

  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  const handleExport = async () => {
    if (!file) return;

    const url = await task.runTask(
      async () => {
        const payload = {
          files: [{ name: file.name, buffer: file.buffer.slice(0) }],
          pages: pages.map((p) => ({
            fileIndex: 0,
            pageIndex: p.pageIndex,
            rotation: p.rotation,
          })),
        };

        const result = await postTask<typeof payload, PdfWorkerBufferResult>(
          'MERGE_SPLIT_ROTATE',
          payload
        );

        const blob = new Blob([result.buffer], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      },
      {
        initialMessage: 'Applying rotations…',
        errorMessage: 'Failed to rotate the document pages.',
      }
    );

    if (url.ok) setRotatedBlobUrl(url.value);
  };

  const clearWorkspace = () => {
    setFile(null);
    setPages([]);
    setRotatedBlobUrl('');
    task.reset();
  };

  return (
    <ToolPageShell
      title={tool.title}
      description={tool.description}
      icon={tool.icon}
      category={tool.category}
    >
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to rotate"
          />
        </div>
      ) : !rotatedBlobUrl ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Visual Grid of Pages */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold font-manrope">
                <span
                  className={`flex h-2 w-2 rounded-full ${ACCENTS[tool.category].bar}`}
                  aria-hidden
                />
                Workspace pages
              </h2>
              <span className="text-xs text-muted-foreground font-dm-sans">
                Total: {file.pageCount} page{file.pageCount > 1 ? 's' : ''}
              </span>
            </div>

            <div className="max-h-[500px] min-h-[300px] overflow-y-auto rounded-2xl border border-border/60 bg-muted/5 p-5 pr-2">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {pages.map((item) => (
                  <div
                    key={item.pageIndex}
                    className="group relative flex aspect-[3/4] select-none flex-col overflow-hidden rounded-xl border border-border/60 bg-background"
                  >
                    <div className="flex h-7 items-center justify-between border-b border-border/40 bg-muted/20 px-2">
                      <span className="text-xs font-bold text-muted-foreground font-dm-sans">
                        p. {item.pageIndex + 1}
                      </span>
                      {item.rotation > 0 && (
                        <span className="rounded bg-category-doc/10 px-1.5 py-0.5 text-xs font-bold text-category-doc font-dm-sans">
                          {item.rotation}°
                        </span>
                      )}
                    </div>

                    <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/5 p-2">
                      <div
                        className="relative flex h-full w-full items-center justify-center transition-transform duration-300"
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                      >
                        {item.thumbnailUrl ? (
                          <Image
                            src={item.thumbnailUrl}
                            alt={`Page ${item.pageIndex + 1}`}
                            fill
                            unoptimized
                            sizes="(min-width: 768px) 12rem, 50vw"
                            className="pointer-events-none rounded object-contain p-2"
                          />
                        ) : (
                          <div className="px-1 text-center text-xs text-muted-foreground font-dm-sans">
                            Not previewed (over 30 pages)
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/40 backdrop-blur-[1px] transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => rotateIndividualPage(item.pageIndex, -90)}
                          aria-label={`Rotate page ${item.pageIndex + 1} counter-clockwise`}
                          className="size-8 rounded-lg border border-border/40 shadow-sm [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          <span className="text-sm font-bold" aria-hidden>
                            ↶
                          </span>
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => rotateIndividualPage(item.pageIndex, 90)}
                          aria-label={`Rotate page ${item.pageIndex + 1} clockwise`}
                          className="size-8 rounded-lg border border-border/40 shadow-sm [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                        >
                          <HugeiconsIcon
                            icon={RotateRightIcon}
                            className="size-4"
                            aria-hidden
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Config panel */}
          <div className="md:col-span-1">
            <ToolPanel title="Rotate settings" sticky>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold font-dm-sans text-foreground/80">
                  Bulk Actions:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotateAllPages(90)}
                    className="text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                  >
                    Rotate All 90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotateAllPages(180)}
                    className="text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                  >
                    Rotate All 180°
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllRotations}
                  className="mt-1 w-full text-xs font-semibold text-destructive hover:bg-destructive/5 [@media(pointer:coarse)]:min-h-11"
                >
                  Reset All Rotations
                </Button>
              </div>

              <PanelActions>
                <PanelPrimaryAction category={tool.category}
                  onClick={handleExport}
                  disabled={task.isProcessing}
                >
                  Save &amp; Export
                </PanelPrimaryAction>
                <PanelSecondaryAction
                  onClick={clearWorkspace}
                  disabled={task.isProcessing}
                >
                  Change File
                </PanelSecondaryAction>
              </PanelActions>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Page Rotation Saved"
          description={`Rotations applied to ${file.name}. Processed locally, and nothing was uploaded.`}
          actions={
            <>
              <Button
                variant="outline"
                onClick={clearWorkspace}
                className="flex-1 py-5 text-xs font-semibold"
              >
                Start Over
              </Button>
              <Button
                asChild
                className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.category].button}`}
              >
                <a href={rotatedBlobUrl} download={`rotated_${file.name}`}>
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                  Download PDF
                </a>
              </Button>
            </>
          }
        />
      )}

      {task.isProcessing && (
        <ProcessingOverlay
          category={tool.category}
          message={task.message}
          progress={task.progress}
        />
      )}
    </ToolPageShell>
  );
}
