'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { getPdfPageCount, renderPdfPagesToDataUrls } from '@/lib/pdf-utils';
import { Card } from '@/components/ui/card';
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
  const [splitBlobUrl, setSplitBlobUrl] = useState<string>('');

  useEffect(() => {
    return () => {
      if (splitBlobUrl) {
        URL.revokeObjectURL(splitBlobUrl);
      }
    };
  }, [splitBlobUrl]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setSplitBlobUrl('');

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

    const url = await task.runTask(
      async (report) => {
        // PDF Split uses the same MERGE_SPLIT_ROTATE worker command.
        // We pass the single file buffer and the selected pages sequence.
        const payload = {
          files: [{ name: file.name, buffer: file.buffer.slice(0) }],
          pages: selectedPages.map((idx) => ({
            fileIndex: 0,
            pageIndex: idx,
            rotation: 0,
          })),
        };

        const result = await postTask<typeof payload, PDFWorkerResult>(
          'MERGE_SPLIT_ROTATE',
          payload,
          (pct, msg) => report(pct, msg)
        );

        const blob = new Blob([result.buffer], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      },
      {
        initialMessage: 'Extracting selected pages…',
        errorMessage: 'Failed to split document.',
      }
    );

    if (url.ok) setSplitBlobUrl(url.value);
  };

  const clearWorkspace = () => {
    setFile(null);
    setPages([]);
    setSelectedPages([]);
    setRangeInput('');
    setSplitBlobUrl('');
    task.reset();
  };

  return (
    <ToolPageShell
      title={tool.title}
      description={tool.description}
      icon={tool.icon}
      accent={tool.accent}
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
      ) : !splitBlobUrl ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 md:grid-cols-3">
            {/* Visual Grid of Pages */}
            <div className="flex flex-col gap-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold font-manrope">
                  <span
                    className={`flex h-2 w-2 rounded-full ${ACCENTS[tool.accent].bar}`}
                    aria-hidden
                  />
                  Select Pages to Keep
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleSelectAll}
                    className="text-xs font-semibold"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleSelectNone}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Light Table Selection Area */}
              <div className="max-h-[500px] min-h-[300px] overflow-y-auto rounded-2xl border border-border/60 bg-muted/5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] p-5 pr-2 [background-size:20px_20px]">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {pages.map((item) => {
                    const isSelected = selectedPages.includes(item.pageIndex);
                    return (
                      <label
                        key={item.pageIndex}
                        className={`group relative flex aspect-[3/4] cursor-pointer select-none flex-col overflow-hidden rounded-xl border bg-background transition-all duration-200 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 ${
                          isSelected
                            ? 'border-orange-500 shadow ring-2 ring-orange-500/10'
                            : 'border-border/60 opacity-60 hover:opacity-90'
                        }`}
                      >
                        {/* Checkbox Header */}
                        <div className="flex h-7 items-center justify-between border-b border-border/40 bg-muted/20 px-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxToggle(item.pageIndex)}
                            className="size-3 cursor-pointer rounded accent-orange-500"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground font-dm-sans">
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
                            <div className="text-[10px] text-muted-foreground font-dm-sans">
                              Preview unavailable
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
              <Card className="sticky top-6 flex flex-col gap-6 border-border/60 bg-background/50 p-6 backdrop-blur-sm">
                <h2 className="border-b border-border/40 pb-3 text-sm font-bold font-manrope">
                  Split Settings
                </h2>

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
                    className="h-10 text-sm font-dm-sans"
                  />
                  <span className="text-[10px] leading-relaxed text-muted-foreground font-dm-sans">
                    Use commas to separate page numbers/ranges. e.g.,{' '}
                    <strong>1-3, 5</strong> yields pages 1, 2, 3, and 5.
                  </span>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/40 pt-2">
                  <Button
                    onClick={handleSplit}
                    disabled={selectedPages.length === 0 || task.isProcessing}
                    className={`w-full font-semibold font-manrope ${ACCENTS[tool.accent].button}`}
                  >
                    Extract {selectedPages.length} Page
                    {selectedPages.length !== 1 ? 's' : ''}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearWorkspace}
                    disabled={task.isProcessing}
                    className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel / Reset
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Extraction Complete"
          description={`Extracted ${selectedPages.length} page${
            selectedPages.length !== 1 ? 's' : ''
          } from ${file.name} successfully. Processed locally.`}
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
                className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.accent].button}`}
              >
                <a href={splitBlobUrl} download={`extracted_${file.name}`}>
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
          accent={tool.accent}
          message={task.message}
          progress={task.progress}
        />
      )}
    </ToolPageShell>
  );
}
