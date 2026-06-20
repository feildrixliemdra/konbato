'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useWorker } from '@/lib/hooks/useWorker';
import { getPdfPageCount, renderPdfPageToDataUrl } from '@/lib/pdf-utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  SplitIcon,
  Download01Icon,
  ArrowLeft01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

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
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);

  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
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

    setIsProcessing(true);
    setProgress(15);
    setProgressMessage('Reading document structure...');

    try {
      const targetFile = selectedFiles[0];
      const buffer = await targetFile.arrayBuffer();
      const pageCount = await getPdfPageCount(buffer);

      setFile({
        name: targetFile.name,
        size: targetFile.size,
        buffer,
        pageCount,
      });

      const newPagesList: PDFPageItem[] = [];
      const renderPagesCount = Math.min(pageCount, 30);
      
      for (let p = 0; p < renderPagesCount; p++) {
        setProgressMessage(`Rendering thumbnail page ${p + 1}/${renderPagesCount}...`);
        const thumbnail = await renderPdfPageToDataUrl(buffer, p + 1);
        newPagesList.push({
          pageIndex: p,
          thumbnailUrl: thumbnail,
        });
      }

      for (let p = renderPagesCount; p < pageCount; p++) {
        newPagesList.push({
          pageIndex: p,
          thumbnailUrl: '', // placeholder
        });
      }

      setPages(newPagesList);
      // Select all pages by default
      const allIndices = Array.from({ length: pageCount }, (_, idx) => idx);
      setSelectedPages(allIndices);
      setRangeInput(generateRangeString(allIndices));
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to render PDF pages.');
    } finally {
      setIsProcessing(false);
    }
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
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Extracting selected pages...');

    try {
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

      const result = await postTask<typeof payload, PDFWorkerResult>('MERGE_SPLIT_ROTATE', payload, (pct, msg) => {
        setProgress(pct);
        if (msg) setProgressMessage(msg);
      });

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSplitBlobUrl(url);
      setProgress(100);
      setProgressMessage('Split completed!');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to split document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearWorkspace = () => {
    setFile(null);
    setPages([]);
    setSelectedPages([]);
    setRangeInput('');
    setSplitBlobUrl('');
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-primary/20 bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12 max-w-4xl">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
          Back to Tools
        </Link>

        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <HugeiconsIcon icon={SplitIcon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Split PDF</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Extract custom ranges or individual pages from a PDF. Runs entirely locally in browser memory.
          </p>
        </div>

        {!file ? (
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to split"
          />
        ) : !splitBlobUrl ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Visual Grid of Pages */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-orange-500" />
                  Select Pages to Keep
                </h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" onClick={handleSelectAll} className="text-xs font-semibold">
                    Select All
                  </Button>
                  <Button variant="ghost" size="xs" onClick={handleSelectNone} className="text-xs font-semibold text-rose-500 hover:text-rose-600">
                    Clear
                  </Button>
                </div>
              </div>

              {/* Light Table Selection Area */}
              <div className="rounded-2xl border border-border/60 bg-muted/5 p-5 min-h-[300px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {pages.map((item) => {
                    const isSelected = selectedPages.includes(item.pageIndex);
                    return (
                      <div
                        key={item.pageIndex}
                        onClick={() => handleCheckboxToggle(item.pageIndex)}
                        className={`group relative aspect-[3/4] rounded-xl overflow-hidden border bg-background flex flex-col cursor-pointer transition-all duration-200 select-none ${
                          isSelected
                            ? 'border-orange-500 ring-2 ring-orange-500/10 shadow'
                            : 'border-border/60 opacity-60 hover:opacity-90'
                        }`}
                      >
                        {/* Checkbox Header */}
                        <div className="h-7 px-2 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="accent-orange-500 rounded size-3 cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground font-dm-sans">
                            Page {item.pageIndex + 1}
                          </span>
                        </div>

                        {/* Thumbnail or placeholder */}
                        <div className="flex-1 min-h-0 p-2 flex items-center justify-center bg-muted/5">
                          {item.thumbnailUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.thumbnailUrl}
                              alt={`Page ${item.pageIndex + 1}`}
                              className="max-w-full max-h-full object-contain shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded pointer-events-none"
                            />
                          ) : (
                            <div className="text-[10px] text-muted-foreground font-dm-sans">
                              Loading...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Config panel */}
            <div className="md:col-span-1">
              <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6 sticky top-6">
                <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                  Split Settings
                </h3>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground font-dm-sans">
                  <span>File: <strong>{file.name}</strong></span>
                  <span>Size: <strong>{(file.size / 1024 / 1024).toFixed(2)} MB</strong></span>
                  <span>Total Pages: <strong>{file.pageCount}</strong></span>
                </div>

                {/* Range Input Box */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Page Range:
                  </label>
                  <Input
                    type="text"
                    value={rangeInput}
                    onChange={handleRangeInputChange}
                    onBlur={handleRangeInputBlur}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="h-10 text-sm font-dm-sans"
                  />
                  <span className="text-[10px] text-muted-foreground leading-relaxed font-dm-sans">
                    Use commas to separate page numbers/ranges. e.g., <strong>1-3, 5</strong> yields pages 1, 2, 3, and 5.
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                  <Button
                    onClick={handleSplit}
                    disabled={selectedPages.length === 0 || isProcessing}
                    className="w-full font-semibold font-manrope bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/15"
                  >
                    Extract {selectedPages.length} Page{selectedPages.length !== 1 ? 's' : ''}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearWorkspace}
                    disabled={isProcessing}
                    className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel / Reset
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Output Success State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto flex flex-col gap-6"
          >
            <div className="border border-border/60 bg-background/50 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center gap-6 text-center shadow-xl">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <HugeiconsIcon icon={Tick01Icon} className="size-7" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-2xl font-manrope">Extraction Complete</h3>
                <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed">
                  Extracted {selectedPages.length} pages from <strong>{file.name}</strong> successfully.
                  Processed locally.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={clearWorkspace}
                  className="flex-1 font-semibold text-xs py-5"
                >
                  Start Over
                </Button>
                <Button
                  asChild
                  className="flex-1 font-semibold text-xs py-5 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/15"
                >
                  <a href={splitBlobUrl} download={`extracted_${file.name}`}>
                    <HugeiconsIcon icon={Download01Icon} className="size-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="p-6 max-w-sm w-full mx-4 border-border/60 flex flex-col items-center gap-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
