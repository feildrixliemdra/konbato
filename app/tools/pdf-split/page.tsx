'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import JSZip from 'jszip';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { PanelActions, PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { getPdfPageCount, renderPdfPagesToDataUrls } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';

const tool = requireTool('pdf-split');

interface PDFFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount: number;
}

interface PDFPageItem {
  pageIndex: number; // 0-based
  thumbnailUrl: string;
}

interface PDFWorkerResult {
  buffer: ArrayBuffer;
}

interface SplitResult {
  url: string;
  downloadName: string;
  title: string;
  description: string;
}

function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

// Helpers for Range Parsing and Generation
function parseRangeString(rangeStr: string, totalPages: number): number[] {
  const result: number[] = [];
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          result.push(i - 1);
        }
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        result.push(page - 1);
      }
    }
  }
  return Array.from(new Set(result)).sort((a, b) => a - b);
}

function generateRangeString(selectedIndices: number[]): string {
  if (selectedIndices.length === 0) return '';
  const sorted = [...selectedIndices].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      if (start === prev) {
        ranges.push(`${start + 1}`);
      } else {
        ranges.push(`${start + 1}-${prev + 1}`);
      }
      start = curr;
      prev = curr;
    }
  }

  if (start === prev) {
    ranges.push(`${start + 1}`);
  } else {
    ranges.push(`${start + 1}-${prev + 1}`);
  }

  return ranges.join(', ');
}

export default function PDFSplitPage() {
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
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [mode, setMode] = useState<'extract' | 'split'>('extract');
  const [result, setResult] = useState<SplitResult | null>(null);

  useEffect(() => {
    return () => {
      if (result) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setResult(null);

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
            report(
              15 + (current / total) * 80,
              `Rendering thumbnail page ${current}/${total}…`
            );
          }
        );

        const pagesList: PDFPageItem[] = [];
        for (let p = 0; p < renderPagesCount; p++) {
          pagesList.push({ pageIndex: p, thumbnailUrl: thumbnails[p] });
        }
        for (let p = renderPagesCount; p < pageCount; p++) {
          pagesList.push({ pageIndex: p, thumbnailUrl: '' });
        }

        return { targetFile, buffer, pageCount, pagesList };
      },
      {
        initialMessage: 'Reading document…',
        errorMessage: 'Failed to render PDF pages.',
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

    const allIndices = Array.from({ length: pageCount }, (_, idx) => idx);
    setPages(pagesList);
    setSelectedPages(allIndices);
    setRangeInput(generateRangeString(allIndices));
  };

  const handleCheckboxToggle = (pageIndex: number) => {
    let updated: number[];
    if (selectedPages.includes(pageIndex)) {
      updated = selectedPages.filter((idx) => idx !== pageIndex);
    } else {
      updated = [...selectedPages, pageIndex].sort((a, b) => a - b);
    }
    setSelectedPages(updated);
    setRangeInput(generateRangeString(updated));
  };

  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRangeInput(value);

    if (file) {
      // Parse updated indices without resetting input cursor
      const parsed = parseRangeString(value, file.pageCount);
      setSelectedPages(parsed);
    }
  };

  const handleRangeInputBlur = () => {
    setRangeInput(generateRangeString(selectedPages));
  };

  const handleSelectAll = () => {
    if (!file) return;
    const all = Array.from({ length: file.pageCount }, (_, idx) => idx);
    setSelectedPages(all);
    setRangeInput(generateRangeString(all));
  };

  const handleSelectNone = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  const handleSplit = async () => {
    if (!file || selectedPages.length === 0) return;
    const isSplit = mode === 'split';

    const outcome = await task.runTask(
      async (report) => {
        const fileBuffer = file.buffer.slice(0);
        const sourceFile = { name: file.name, buffer: fileBuffer };

        // Both modes reuse the same MERGE_SPLIT_ROTATE worker command, passing
        // a single source file and the page subset to keep.
        const buildSubset = (indices: number[]) => {
          const payload = {
            files: [sourceFile],
            pages: indices.map((idx) => ({
              fileIndex: 0,
              pageIndex: idx,
              rotation: 0,
            })),
          };
          return postTask<typeof payload, PDFWorkerResult>(
            'MERGE_SPLIT_ROTATE',
            payload,
            (pct, msg) => report(pct, msg)
          );
        };

        if (!isSplit) {
          report(5, 'Extracting selected pages…');
          const res = await buildSubset(selectedPages);
          const blob = new Blob([res.buffer], { type: 'application/pdf' });
          return {
            url: URL.createObjectURL(blob),
            downloadName: `extracted_${file.name}`,
            title: 'Extraction Complete',
            description: `Extracted ${selectedPages.length} page${
              selectedPages.length !== 1 ? 's' : ''
            } from ${file.name} successfully. Processed locally.`,
          } satisfies SplitResult;
        }

        // Split mode: one single-page PDF per selected page, zipped together.
        // Each subset call re-grafts the source document, so this is one worker
        // round-trip per page; fine for typical documents, though a very large
        // document pays that cost once per selected page.
        const zip = new JSZip();
        for (let i = 0; i < selectedPages.length; i++) {
          const pageIndex = selectedPages[i];
          report(
            Math.round((i / selectedPages.length) * 100),
            `Splitting page ${i + 1} of ${selectedPages.length}…`
          );
          const res = await buildSubset([pageIndex]);
          zip.file(`page-${pageIndex + 1}.pdf`, res.buffer);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        return {
          url: URL.createObjectURL(zipBlob),
          downloadName: `${baseName(file.name)}_split.zip`,
          title: 'Split Complete',
          description: `Split ${selectedPages.length} page${
            selectedPages.length !== 1 ? 's' : ''
          } into ${selectedPages.length} separate PDF${
            selectedPages.length !== 1 ? 's' : ''
          }. Processed locally.`,
        } satisfies SplitResult;
      },
      {
        initialMessage: isSplit ? 'Preparing split…' : 'Extracting selected pages…',
        errorMessage: 'Failed to split document.',
      }
    );

    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPages([]);
    setSelectedPages([]);
    setRangeInput('');
    setResult(null);
    setMode('extract');
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
            description="Upload PDF document to split"
          />
        </div>
      ) : !result ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 md:grid-cols-3">
            {/* Visual Grid of Pages */}
            <div className="flex flex-col gap-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold font-manrope">
                  <span
                    className={`flex h-2 w-2 rounded-full ${ACCENTS[tool.category].bar}`}
                    aria-hidden
                  />
                  Select Pages to Keep
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleSelectAll}
                    className="text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleSelectNone}
                    className="text-xs font-semibold text-destructive hover:text-destructive/80 [@media(pointer:coarse)]:min-h-11"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Light Table Selection Area */}
              <div className="max-h-[500px] min-h-[300px] overflow-y-auto rounded-2xl border border-border/60 bg-muted/5 bg-[radial-gradient(var(--border)_1px,transparent_1px)] p-5 pr-2 [background-size:20px_20px]">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {pages.map((item) => {
                    const isSelected = selectedPages.includes(item.pageIndex);
                    return (
                      <label
                        key={item.pageIndex}
                        className={`group relative flex aspect-[3/4] cursor-pointer select-none flex-col overflow-hidden rounded-xl border bg-background transition-[border-color,box-shadow,opacity] duration-200 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 ${
                          isSelected
                            ? 'border-category-doc shadow ring-2 ring-category-doc/10'
                            : 'border-border/60 opacity-60 hover:opacity-90'
                        }`}
                      >
                        {/* Checkbox Header */}
                        <div className="flex h-7 items-center justify-between border-b border-border/40 bg-muted/20 px-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxToggle(item.pageIndex)}
                            className="size-3 cursor-pointer rounded accent-category-doc"
                          />
                          <span className="text-xs font-bold text-muted-foreground font-dm-sans">
                            Page {item.pageIndex + 1}
                          </span>
                        </div>

                        {/* Thumbnail or placeholder */}
                        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/5 p-2">
                          {item.thumbnailUrl ? (
                            <Image
                              src={item.thumbnailUrl}
                              alt=""
                              fill
                              unoptimized
                              sizes="(min-width: 768px) 12rem, 50vw"
                              className="pointer-events-none rounded object-contain p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                            />
                          ) : (
                            <div className="px-1 text-center text-xs text-muted-foreground font-dm-sans">
                              Not previewed (over 30 pages)
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Config panel */}
            <div className="md:col-span-1">
              <ToolPanel title="Split settings" sticky>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground font-dm-sans">
                  <span className="truncate">
                    File: <strong className="text-foreground">{file.name}</strong>
                  </span>
                  <span>
                    Size: <strong>{formatSize(file.size)}</strong>
                  </span>
                  <span>
                    Total Pages: <strong>{file.pageCount}</strong>
                  </span>
                </div>

                {/* Mode toggle */}
                <div className="flex flex-col gap-2">
                  <span
                    id="split-mode-label"
                    className="text-xs font-semibold text-foreground/80 font-dm-sans"
                  >
                    Mode:
                  </span>
                  <div role="group" aria-labelledby="split-mode-label" className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={mode === 'extract' ? 'secondary' : 'outline'}
                      size="xs"
                      aria-pressed={mode === 'extract'}
                      onClick={() => setMode('extract')}
                      className="h-9 text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                    >
                      Extract pages
                    </Button>
                    <Button
                      type="button"
                      variant={mode === 'split' ? 'secondary' : 'outline'}
                      size="xs"
                      aria-pressed={mode === 'split'}
                      onClick={() => setMode('split')}
                      className="h-9 text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                    >
                      Split into files
                    </Button>
                  </div>
                  {mode === 'split' && (
                    <span className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                      Creates one single-page PDF per selected page, bundled into a zip.
                    </span>
                  )}
                </div>

                {/* Range Input Box */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="split-range"
                    className="text-xs font-semibold text-foreground/80 font-dm-sans"
                  >
                    Page Range:
                  </label>
                  <Input
                    id="split-range"
                    type="text"
                    value={rangeInput}
                    onChange={handleRangeInputChange}
                    onBlur={handleRangeInputBlur}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="h-10 text-base sm:text-sm font-dm-sans"
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                    Use commas to separate page numbers/ranges. e.g.,{' '}
                    <strong>1-3, 5</strong> yields pages 1, 2, 3, and 5.
                  </span>
                </div>

                <PanelActions>
                  <PanelPrimaryAction category={tool.category}
                    onClick={handleSplit}
                    disabled={selectedPages.length === 0 || task.isProcessing}
                  >
                    {mode === 'split'
                      ? `Split into ${selectedPages.length} File${
                          selectedPages.length !== 1 ? 's' : ''
                        }`
                      : `Extract ${selectedPages.length} Page${
                          selectedPages.length !== 1 ? 's' : ''
                        }`}
                  </PanelPrimaryAction>
                  <PanelSecondaryAction
                    onClick={clearWorkspace}
                    disabled={task.isProcessing}
                  >
                    Cancel / Reset
                  </PanelSecondaryAction>
                </PanelActions>
              </ToolPanel>
            </div>
          </div>
        </div>
      ) : (
        <SuccessCard
          title={result.title}
          description={result.description}
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
                <a href={result.url} download={result.downloadName}>
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                  {result.downloadName.endsWith('.zip') ? 'Download ZIP' : 'Download PDF'}
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
