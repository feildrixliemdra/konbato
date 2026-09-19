'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { LabeledSlider } from '@/components/tools/labeled-slider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';
import { cn } from '@/lib/utils';

const tool = requireTool('pdf-compress');

interface PDFFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

interface CompressedResult {
  name: string;
  originalSize: number;
  compressedSize: number;
  blobUrl: string;
}

interface PDFWorkerResult {
  buffer: ArrayBuffer;
}

export default function PDFCompressPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
      type: 'module',
    });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PDFFile | null>(null);
  const [compressionMode, setCompressionMode] = useState<'light' | 'deep'>('light');
  const [quality, setQuality] = useState<number>(60);
  const [dpi, setDpi] = useState<number>(150);
  const [result, setResult] = useState<CompressedResult | null>(null);

  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setResult(null);
    task.clearError();

    const targetFile = selectedFiles[0];
    const loaded = await task.runTask(
      async () => {
        const buffer = await targetFile.arrayBuffer();
        return { name: targetFile.name, size: targetFile.size, buffer };
      },
      {
        initialMessage: 'Reading document…',
        errorMessage: 'Could not read this PDF file.',
      }
    );

    if (loaded.ok) setFile(loaded.value);
  };

  const handleCompress = async () => {
    if (!file) return;

    const outcome = await task.runTask(
      async () => {
        const isDeep = compressionMode === 'deep';
        const payload = isDeep
          ? { buffer: file.buffer.slice(0), quality, dpi }
          : { buffer: file.buffer.slice(0) };

        const response = await postTask<typeof payload, PDFWorkerResult>(
          isDeep ? 'COMPRESS_DEEP' : 'COMPRESS_LIGHT',
          payload
        );

        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return {
          name: file.name,
          originalSize: file.size,
          compressedSize: blob.size,
          blobUrl: URL.createObjectURL(blob),
        };
      },
      {
        initialMessage:
          compressionMode === 'deep'
            ? 'Rasterizing and compressing pages…'
            : 'Scrubbing metadata and structures…',
        errorMessage: 'PDF compression failed. Try the other compression mode.',
      }
    );

    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => {
    setFile(null);
    setResult(null);
    task.reset();
  };

  const modeButton = (mode: 'light' | 'deep', label: string) => (
    <button
      type="button"
      onClick={() => setCompressionMode(mode)}
      aria-pressed={compressionMode === mode}
      className={cn(
        'flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all',
        compressionMode === mode
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );

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
            description="Upload PDF document to compress"
          />
        </div>
      ) : !result ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Options Selector */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
              <h2 className="text-sm font-bold font-manrope">Compression Mode</h2>

              <div
                role="group"
                aria-label="Compression mode"
                className="flex gap-1.5 rounded-xl border border-border/40 bg-muted/40 p-1"
              >
                {modeButton('light', 'Light (Lossless)')}
                {modeButton('deep', 'Deep (Rasterize)')}
              </div>
            </div>

            {compressionMode === 'light' ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/5 p-6">
                <h3 className="text-sm font-bold font-manrope text-foreground">
                  Light Lossless Compression
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans sm:text-sm">
                  Light compression keeps all text and vector graphics 100% vector-sharp
                  and searchable. It works by:
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-xs text-muted-foreground font-dm-sans">
                  <li>
                    Purging document metadata (author, created date, software producer,
                    etc.)
                  </li>
                  <li>
                    Removing duplicate internal resources (like fonts loaded multiple
                    times)
                  </li>
                  <li>Compacting cross-reference table objects</li>
                  <li>Running clean garbage collection on unreferenced objects</li>
                </ul>
                <span className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 font-dm-sans dark:text-amber-400">
                  Ideal for: text-heavy contracts, official receipts, and vector drawings.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-muted/5 p-6">
                <div>
                  <h3 className="text-sm font-bold font-manrope text-foreground">
                    Deep Rasterized Compression
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-dm-sans sm:text-sm">
                    Deep compression flattens pages into raster images to maximize size
                    reduction. <strong>Note: text selection is removed</strong>, but size
                    decreases drastically.
                  </p>
                </div>

                <LabeledSlider
                  id="compress-quality"
                  label="Image Quality:"
                  value={quality}
                  min={10}
                  max={90}
                  step={5}
                  unit="%"
                  onChange={setQuality}
                  hint="Lower values yield smaller PDF sizes but more visible compression artifacts."
                />

                <LabeledSlider
                  id="compress-dpi"
                  label="Rendering DPI (Resolution):"
                  value={dpi}
                  min={72}
                  max={200}
                  step={2}
                  unit=" DPI"
                  onChange={setDpi}
                  hint="Standard screen display is 72–150 DPI. 150 DPI is recommended for readable scans."
                />
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-6 flex flex-col gap-6 border-border/60 bg-background/50 p-6 backdrop-blur-sm">
              <h2 className="border-b border-border/40 pb-3 text-sm font-bold font-manrope">
                Document Details
              </h2>

              <div className="flex flex-col gap-2.5 text-xs text-muted-foreground font-dm-sans">
                <span>
                  Name:{' '}
                  <strong className="block truncate text-foreground">{file.name}</strong>
                </span>
                <span>
                  Original Size: <strong>{formatSize(file.size)}</strong>
                </span>
                <span>
                  Method:{' '}
                  <strong>
                    {compressionMode === 'light'
                      ? 'Lossless Vector Clean'
                      : 'Deep Page Raster'}
                  </strong>
                </span>
              </div>

              <div className="flex flex-col gap-2 border-t border-border/40 pt-2">
                <Button
                  onClick={handleCompress}
                  disabled={task.isProcessing}
                  className={`w-full font-semibold font-manrope ${ACCENTS[tool.accent].button}`}
                >
                  Start Compression
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearWorkspace}
                  disabled={task.isProcessing}
                  className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Change File
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Compression Complete"
          description="Your document has been optimized client-side."
          actions={
            <>
              <Button
                variant="outline"
                onClick={clearWorkspace}
                className="flex-1 py-5 text-xs font-semibold"
              >
                Compress New File
              </Button>
              <Button
                asChild
                className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.accent].button}`}
              >
                <a href={result.blobUrl} download={`compressed_${result.name}`}>
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                  Download PDF
                </a>
              </Button>
            </>
          }
        >
          <div className="grid w-full grid-cols-3 divide-x divide-border/50 overflow-hidden rounded-xl border border-border/50 bg-muted/20 text-center font-dm-sans">
            <div className="flex flex-col gap-0.5 py-4">
              <span className="text-[10px] font-semibold text-muted-foreground">
                ORIGINAL
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatSize(result.originalSize)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 py-4">
              <span className="text-[10px] font-semibold text-muted-foreground">
                COMPRESSED
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatSize(result.compressedSize)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 py-4">
              <span className="text-[10px] font-semibold text-muted-foreground">
                REDUCTION
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {result.originalSize > result.compressedSize
                  ? `${Math.round(
                      ((result.originalSize - result.compressedSize) /
                        result.originalSize) *
                        100
                    )}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </SuccessCard>
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
