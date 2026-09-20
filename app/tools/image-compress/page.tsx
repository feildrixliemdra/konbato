'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { ResultActionBar } from '@/components/tools/result-action-bar';
import { LabeledSlider } from '@/components/tools/labeled-slider';
import { PanelPrimaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { ThumbnailFrame } from '@/components/tools/thumbnail-frame';
import { FieldInput } from '@/components/tools/field-input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick01Icon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';
import { requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';
import { downloadResults } from '@/lib/download';

const tool = requireTool('image-compress');

interface ProcessedFile {
  name: string;
  outputName: string;
  originalSize: number;
  compressedSize: number;
  compressedUrl: string;
  ratio: number;
}

interface ImageWorkerResult {
  buffer?: ArrayBuffer;
  bitmap?: ImageBitmap;
  mimeType: string;
  width: number;
  height: number;
}

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function getOutputFileName(fileName: string, mimeType: string) {
  const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const extension =
    extensionByMimeType[mimeType] || fileName.split('.').pop()?.toLowerCase() || 'jpg';

  return `optimized_${baseName}.${extension}`;
}

export default function ImageCompressPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState<number>(75);
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  const [results, setResults] = useState<ProcessedFile[]>([]);

  useEffect(() => {
    return () => {
      results.forEach((item) => URL.revokeObjectURL(item.compressedUrl));
    };
  }, [results]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResults([]);
    task.clearError();
  };

  const startOver = () => {
    setFiles([]);
    setResults([]);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;

    const compressedResults: ProcessedFile[] = [];

    const outcome = await task.runTask(
      async (report) => {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          report(
            Math.round((i / files.length) * 100),
            `Optimizing ${file.name}…`
          );

          const payload = {
            buffer: await file.arrayBuffer(),
            fileName: file.name,
            quality,
            mimeType: file.type,
            width: resizeWidth ? parseInt(resizeWidth, 10) : undefined,
            height: resizeHeight ? parseInt(resizeHeight, 10) : undefined,
          };

          const result = await postTask<typeof payload, ImageWorkerResult>(
            'COMPRESS',
            payload,
            (workerProgress) => {
              const currentBase = (i / files.length) * 100;
              report(Math.round(currentBase + workerProgress / files.length));
            }
          );

          let outBlob: Blob;
          if (result.bitmap) {
            const canvas = document.createElement('canvas');
            canvas.width = result.width;
            canvas.height = result.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get 2D canvas context');
            ctx.drawImage(result.bitmap, 0, 0);
            outBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error('Canvas toBlob failed'));
                },
                result.mimeType,
                quality / 100
              );
            });
            result.bitmap.close();
          } else {
            if (!result.buffer) {
              throw new Error('Image compression worker returned no output buffer');
            }
            outBlob = new Blob([result.buffer], { type: result.mimeType });
          }

          compressedResults.push({
            name: file.name,
            outputName: getOutputFileName(file.name, result.mimeType),
            originalSize: file.size,
            compressedSize: outBlob.size,
            compressedUrl: URL.createObjectURL(outBlob),
            ratio: Math.round(((file.size - outBlob.size) / file.size) * 100),
          });
        }

        return compressedResults;
      },
      {
        initialMessage: 'Preparing images…',
        errorMessage:
          'Image compression failed. Try a smaller batch or lower the quality setting.',
      }
    );

    if (outcome.ok) setResults(outcome.value);
  };

  const handleDownloadAll = () => {
    downloadResults(
      results.map((item) => ({ name: item.outputName, url: item.compressedUrl })),
      'optimized_images.zip'
    );
  };

  return (
    <ToolPageShell
      title={tool.title}
      description={tool.description}
      icon={tool.icon}
      category={tool.category}
    >
      {results.length === 0 ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />

          <div className="grid gap-6 md:grid-cols-3">
            {/* Upload Area */}
            <div className="md:col-span-2">
              <FileUploadZone
                accept="image/*"
                multiple={true}
                onFilesSelected={handleFilesSelected}
                description="Upload images to optimize (JPEG, PNG, WEBP, GIF, TIFF)"
              />
            </div>

            {/* Options Panel */}
            <div className="md:col-span-1">
              <ToolPanel title="Settings">

                <LabeledSlider
                  id="compress-quality"
                  label="Quality"
                  value={quality}
                  min={10}
                  max={100}
                  unit="%"
                  disabled={task.isProcessing}
                  onChange={setQuality}
                  hint="Recommended: 70% – 85% for the best compression-to-quality ratio."
                />

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold font-dm-sans text-foreground/80">
                    Resize Dimensions (Optional)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="compress-width"
                        className="text-xs text-muted-foreground font-dm-sans"
                      >
                        Width (px)
                      </label>
                      <FieldInput
                        id="compress-width"
                        type="number"
                        placeholder="Auto"
                        value={resizeWidth}
                        onChange={(e) => setResizeWidth(e.target.value)}
                        disabled={task.isProcessing}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="compress-height"
                        className="text-xs text-muted-foreground font-dm-sans"
                      >
                        Height (px)
                      </label>
                      <FieldInput
                        id="compress-height"
                        type="number"
                        placeholder="Auto"
                        value={resizeHeight}
                        onChange={(e) => setResizeHeight(e.target.value)}
                        disabled={task.isProcessing}
                      />
                    </div>
                  </div>
                </div>

                <PanelPrimaryAction category={tool.category}
                  onClick={handleCompress}
                  disabled={files.length === 0 || task.isProcessing}
                >
                  {task.isProcessing ? 'Optimizing…' : 'Compress Images'}
                </PanelPrimaryAction>
              </ToolPanel>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.quick, ease: EASE.out }}
          className="flex flex-col gap-6"
        >
          <ResultActionBar
            title="Compression Complete"
            subtitle={`Optimized ${results.length} image${results.length > 1 ? 's' : ''} successfully.`}
            onStartOver={startOver}
            onDownloadAll={handleDownloadAll}
            downloadLabel={
              results.length === 1 ? 'Download Image' : 'Download All (.zip)'
            }
          />

          <div className="flex flex-col gap-3">
            {results.map((item, idx) => (
              <Card
                key={idx}
                className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ThumbnailFrame>
                    <Image
                      src={item.compressedUrl}
                      alt={`Compressed preview of ${item.name}`}
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  </ThumbnailFrame>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-bold font-manrope text-foreground">
                      {item.outputName}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-dm-sans">
                      <span>Original: {formatSize(item.originalSize)}</span>
                      <span aria-hidden>•</span>
                      <span className="font-semibold text-success">
                        Compressed: {formatSize(item.compressedSize)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
                  {/* A negative ratio is possible (e.g. a PNG re-encoded as PNG),
                      so the badge reports the real outcome instead of "Save -24%". */}
                  {item.ratio > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">
                      <HugeiconsIcon icon={Tick01Icon} className="size-3" aria-hidden />
                      Save {item.ratio}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-xs font-bold text-warning">
                      {Math.abs(item.ratio)}% larger
                    </span>
                  )}
                  <Button size="sm" variant="outline" asChild className="text-xs font-semibold">
                    <a href={item.compressedUrl} download={item.outputName}>
                      Download
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
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
