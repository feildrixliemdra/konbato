'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { ResultActionBar } from '@/components/tools/result-action-bar';
import { PanelPrimaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { ThumbnailFrame } from '@/components/tools/thumbnail-frame';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick01Icon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';
import { requireTool } from '@/lib/tools';
import { downloadResults } from '@/lib/download';

const tool = requireTool('image-convert');

interface ProcessedFile {
  name: string;
  outputName: string;
  convertedUrl: string;
  targetFormat: string;
}

interface ImageWorkerResult {
  buffer?: ArrayBuffer;
  bitmap?: ImageBitmap;
  mimeType: string;
  width: number;
  height: number;
}

const extensionByMimeType: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export default function ImageConvertPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('image/png');
  const [results, setResults] = useState<ProcessedFile[]>([]);

  useEffect(() => {
    return () => {
      results.forEach((item) => URL.revokeObjectURL(item.convertedUrl));
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

  const handleConvert = async () => {
    if (files.length === 0) return;

    const targetExt = extensionByMimeType[targetFormat] ?? 'png';
    const convertedResults: ProcessedFile[] = [];

    const outcome = await task.runTask(
      async (report) => {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          report(Math.round((i / files.length) * 100), `Converting ${file.name}…`);

          const payload = {
            buffer: await file.arrayBuffer(),
            fileName: file.name,
            targetMimeType: targetFormat,
          };

          const result = await postTask<typeof payload, ImageWorkerResult>(
            'CONVERT',
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
              const hasQuality =
                targetFormat === 'image/jpeg' || targetFormat === 'image/webp';
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error('Canvas toBlob failed'));
                },
                targetFormat,
                hasQuality ? 0.85 : undefined
              );
            });
            result.bitmap.close();
          } else if (result.buffer) {
            outBlob = new Blob([result.buffer], { type: targetFormat });
          } else {
            throw new Error('Image worker returned no output buffer.');
          }

          const baseName =
            file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

          convertedResults.push({
            name: file.name,
            outputName: `${baseName}.${targetExt}`,
            convertedUrl: URL.createObjectURL(outBlob),
            targetFormat: targetExt.toUpperCase(),
          });
        }

        return convertedResults;
      },
      {
        initialMessage: 'Preparing images…',
        errorMessage:
          'Conversion failed. The image may be unsupported or corrupted, or your browser ran out of memory.',
      }
    );

    if (outcome.ok) setResults(outcome.value);
  };

  const handleDownloadAll = () => {
    downloadResults(
      results.map((item) => ({ name: item.outputName, url: item.convertedUrl })),
      'converted_images.zip'
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
                description="Upload images to convert (JPG, PNG, WEBP, GIF, TIFF)"
              />
            </div>

            {/* Options Panel */}
            <div className="md:col-span-1">
              <ToolPanel title="Settings">

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="convert-format"
                    className="text-xs font-semibold font-dm-sans text-foreground/80"
                  >
                    Convert To:
                  </label>
                  <Select
                    value={targetFormat}
                    onValueChange={setTargetFormat}
                    disabled={task.isProcessing}
                  >
                    <SelectTrigger id="convert-format" className="h-10 w-full">
                      <SelectValue placeholder="Select target format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/png">PNG (Lossless)</SelectItem>
                      <SelectItem value="image/jpeg">JPG / JPEG (Lossy)</SelectItem>
                      <SelectItem value="image/webp">WEBP (Modern / Small)</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                    Note: converting to PNG yields a larger file because compression is
                    lossless.
                  </span>
                </div>

                <PanelPrimaryAction category={tool.category}
                  onClick={handleConvert}
                  disabled={files.length === 0 || task.isProcessing}
                >
                  {task.isProcessing ? 'Converting…' : 'Convert Images'}
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
            title="Conversion Complete"
            subtitle={`Converted ${results.length} image${results.length > 1 ? 's' : ''} successfully.`}
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
                      src={item.convertedUrl}
                      alt={`Converted preview of ${item.name}`}
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
                    <span className="text-xs text-muted-foreground font-dm-sans">
                      {item.targetFormat} Format • Ready
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
                  <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">
                    <HugeiconsIcon icon={Tick01Icon} className="size-3" aria-hidden />
                    Success
                  </span>
                  <Button size="sm" variant="outline" asChild className="text-xs font-semibold">
                    <a href={item.convertedUrl} download={item.outputName}>
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
