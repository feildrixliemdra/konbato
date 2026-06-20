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
import { HugeiconsIcon } from '@hugeicons/react';
import {
  RotateClockwiseIcon,
  Download01Icon,
  ArrowLeft01Icon,
  Tick01Icon,
  RotateRightIcon,
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
  rotation: number; // 0, 90, 180, 270
}

interface PdfWorkerBufferResult {
  buffer: ArrayBuffer;
}

export default function PDFRotatePage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);

  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [rotatedBlobUrl, setRotatedBlobUrl] = useState<string>('');

  useEffect(() => {
    return () => {
      if (rotatedBlobUrl) {
        URL.revokeObjectURL(rotatedBlobUrl);
      }
    };
  }, [rotatedBlobUrl]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setRotatedBlobUrl('');

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
          rotation: 0,
        });
      }

      for (let p = renderPagesCount; p < pageCount; p++) {
        newPagesList.push({
          pageIndex: p,
          thumbnailUrl: '', // placeholder
          rotation: 0,
        });
      }

      setPages(newPagesList);
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to render PDF pages.');
    } finally {
      setIsProcessing(false);
    }
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
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + degrees + 360) % 360,
      }))
    );
  };

  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  const handleExport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Compiling rotations...');

    try {
      // PDF Rotate uses the same MERGE_SPLIT_ROTATE worker command.
      // We pass the file buffer and the full pages list with their respective rotations.
      const payload = {
        files: [{ name: file.name, buffer: file.buffer.slice(0) }],
        pages: pages.map((p) => ({
          fileIndex: 0,
          pageIndex: p.pageIndex,
          rotation: p.rotation,
        })),
      };

      const result = await postTask<typeof payload, PdfWorkerBufferResult>('MERGE_SPLIT_ROTATE', payload, (pct, msg) => {
        setProgress(pct);
        if (msg) setProgressMessage(msg);
      });

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setRotatedBlobUrl(url);
      setProgress(100);
      setProgressMessage('Rotation saved!');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to rotate document pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearWorkspace = () => {
    setFile(null);
    setPages([]);
    setRotatedBlobUrl('');
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
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <HugeiconsIcon icon={RotateClockwiseIcon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Rotate PDF</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Rotate individual PDF pages or all pages at once. Runs entirely offline in browser memory.
          </p>
        </div>

        {!file ? (
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to rotate"
          />
        ) : !rotatedBlobUrl ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Visual Grid of Pages */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                  Workspace pages
                </h3>
                <span className="text-xs text-muted-foreground font-dm-sans">
                  Total: {file.pageCount} page{file.pageCount > 1 ? 's' : ''}
                </span>
              </div>

              {/* Light Table Grid */}
              <div className="rounded-2xl border border-border/60 bg-muted/5 p-5 min-h-[300px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {pages.map((item) => (
                    <div
                      key={item.pageIndex}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden border bg-background flex flex-col border-border/60 hover:border-border-hover select-none"
                    >
                      {/* Page Label */}
                      <div className="h-7 px-2 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground font-dm-sans">
                          p. {item.pageIndex + 1}
                        </span>
                        {item.rotation > 0 && (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded font-dm-sans">
                            {item.rotation}°
                          </span>
                        )}
                      </div>

                      {/* Thumbnail or placeholder */}
                      <div className="flex-1 min-h-0 p-2 flex items-center justify-center bg-muted/5 relative">
                        <div
                          className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
                          style={{ transform: `rotate(${item.rotation}deg)` }}
                        >
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

                        {/* Hover Overlay Rotates */}
                        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[1px]">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => rotateIndividualPage(item.pageIndex, -90)}
                            className="size-8 rounded-lg shadow-sm border border-border/40"
                            title="Rotate 90° counter-clockwise"
                          >
                            <span className="text-sm font-bold">↶</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => rotateIndividualPage(item.pageIndex, 90)}
                            className="size-8 rounded-lg shadow-sm border border-border/40"
                            title="Rotate 90° clockwise"
                          >
                            <HugeiconsIcon icon={RotateRightIcon} className="size-4" />
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
              <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6 sticky top-6">
                <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                  Rotate Settings
                </h3>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Bulk Actions:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateAllPages(90)}
                      className="text-xs font-semibold"
                    >
                      Rotate All 90°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateAllPages(180)}
                      className="text-xs font-semibold"
                    >
                      Rotate All 180°
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAllRotations}
                    className="w-full text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 mt-1"
                  >
                    Reset All Rotations
                  </Button>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                  <Button
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="w-full font-semibold font-manrope bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15"
                  >
                    Save & Export
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearWorkspace}
                    disabled={isProcessing}
                    className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Change File
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
                <h3 className="font-bold text-2xl font-manrope">Page Rotation Saved</h3>
                <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed">
                  Rotations applied successfully to <strong>{file.name}</strong>. 
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
                  className="flex-1 font-semibold text-xs py-5 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15"
                >
                  <a href={rotatedBlobUrl} download={`rotated_${file.name}`}>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
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
