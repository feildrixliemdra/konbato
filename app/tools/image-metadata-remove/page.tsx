'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { ResultActionBar } from '@/components/tools/result-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick01Icon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { ACCENTS, requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';
import { downloadResults } from '@/lib/download';

const tool = requireTool('image-metadata-remove');

interface ImageWorkerResult {
  buffer: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
}

interface ScrubbedImage {
  name: string;
  originalSize: number;
  scrubbedSize: number;
  url: string;
  width: number;
  height: number;
}

interface MetadataEntry {
  key: string;
  label: string;
  value: string;
}

interface FileMetadata {
  fileName: string;
  entries: MetadataEntry[];
}

const extensionByMime: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function getBaseName(fileName: string) {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export default function ImageMetadataRemovePage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ScrubbedImage[]>([]);
  const [metadataByFile, setMetadataByFile] = useState<FileMetadata[]>([]);

  useEffect(() => {
    return () => {
      results.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [results]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResults([]);
    setMetadataByFile([]);

    if (selectedFiles.length === 0) return;

    const inspected = await task.runTask(
      async () => {
        const found: FileMetadata[] = [];
        for (const file of selectedFiles) {
          const response = await postTask<
            { buffer: ArrayBuffer; fileName: string; mimeType: string },
            { metadata: MetadataEntry[] }
          >('READ_IMAGE_METADATA', {
            buffer: await file.arrayBuffer(),
            fileName: file.name,
            mimeType: file.type,
          });

          found.push({ fileName: file.name, entries: response.metadata });
        }
        return found;
      },
      {
        initialMessage: 'Scanning embedded metadata…',
        errorMessage: 'Could not inspect image metadata.',
      }
    );

    if (inspected.ok) setMetadataByFile(inspected.value);
  };

  const handleScrubMetadata = async () => {
    if (files.length === 0) return;

    const nextResults: ScrubbedImage[] = [];

    const outcome = await task.runTask(
      async (report) => {
        for (let index = 0; index < files.length; index++) {
          const file = files[index];

          report(
            Math.round((index / files.length) * 100),
            `Removing metadata from ${file.name}…`
          );

          const result = await postTask<
            {
              buffer: ArrayBuffer;
              fileName: string;
              mimeType: string;
              targetMimeType: string;
              quality: number;
            },
            ImageWorkerResult
          >(
            'STRIP_IMAGE_METADATA',
            {
              buffer: await file.arrayBuffer(),
              fileName: file.name,
              mimeType: file.type,
              targetMimeType: file.type || 'image/png',
              quality: 92,
            },
            (workerProgress) => {
              const base = (index / files.length) * 100;
              report(Math.round(base + workerProgress / files.length));
            }
          );

          const blob = new Blob([result.buffer], { type: result.mimeType });
          const extension = extensionByMime[result.mimeType] || 'png';
          nextResults.push({
            name: `metadata_removed_${getBaseName(file.name)}.${extension}`,
            originalSize: file.size,
            scrubbedSize: blob.size,
            url: URL.createObjectURL(blob),
            width: result.width,
            height: result.height,
          });
        }

        return nextResults;
      },
      {
        initialMessage: 'Re-encoding images…',
        errorMessage: 'Image metadata removal failed.',
      }
    );

    if (outcome.ok) setResults(outcome.value);
  };

  const handleDownloadAll = () => {
    downloadResults(
      results.map((item) => ({ name: item.name, url: item.url })),
      'metadata_removed_images.zip'
    );
  };

  const clearWorkspace = () => {
    setFiles([]);
    setResults([]);
    setMetadataByFile([]);
    task.reset();
  };

  const detectedMetadataCount = metadataByFile.reduce(
    (sum, item) => sum + item.entries.length,
    0
  );

  return (
    <ToolPageShell
      title={tool.title}
      description="Re-encode visible pixels to remove common embedded image metadata. This is a practical privacy scrub, not forensic sanitization."
      icon={tool.icon}
      accent={tool.accent}
    >
      {results.length === 0 ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FileUploadZone
                accept="image/*"
                multiple={true}
                onFilesSelected={handleFilesSelected}
                description="Upload images to scrub metadata"
              />
            </div>

            <Card className="flex flex-col gap-5 border-border/60 bg-background/50 p-6 backdrop-blur-sm">
              <h2 className="border-b border-border/40 pb-3 text-sm font-bold font-manrope">
                Privacy Scrub
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                The tool draws each image to canvas and exports fresh PNG, JPG, or WebP
                bytes. It removes common EXIF, GPS, camera, and software metadata embedded
                in the original file.
              </p>

              {files.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold font-dm-sans text-foreground/80">
                      Selected Files ({files.length})
                    </span>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-border/50 bg-muted/20 p-2">
                      {files.map((file) => (
                        <div
                          key={`${file.name}-${file.size}`}
                          className="flex items-center justify-between gap-3 py-1.5 text-xs font-dm-sans"
                        >
                          <span className="truncate font-semibold text-foreground/80">
                            {file.name}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/5 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-xs font-bold font-manrope">Metadata Found</h3>
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold ${ACCENTS[tool.accent].tile}`}
                      >
                        {detectedMetadataCount} item
                        {detectedMetadataCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    {detectedMetadataCount === 0 ? (
                      <p className="text-xs text-muted-foreground font-dm-sans">
                        No common EXIF, XMP, ICC, GPS, or text metadata was detected.
                        Re-encoding will still output a fresh file.
                      </p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto pr-1">
                        {metadataByFile.map((item) => (
                          <div key={item.fileName} className="mb-3 last:mb-0">
                            <p className="mb-1 truncate text-[10px] font-bold font-dm-sans text-foreground/80">
                              {item.fileName}
                            </p>
                            <div className="space-y-1">
                              {item.entries.map((entry) => (
                                <div
                                  key={`${item.fileName}-${entry.key}-${entry.value}`}
                                  className="rounded-lg border border-border/40 bg-background/70 p-2 text-xs font-dm-sans"
                                >
                                  <div className="font-semibold text-foreground">
                                    {entry.label}
                                  </div>
                                  <div className="truncate text-[10px] text-muted-foreground">
                                    {entry.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleScrubMetadata}
                disabled={files.length === 0 || task.isProcessing}
                className={`w-full font-semibold font-manrope ${ACCENTS[tool.accent].button}`}
              >
                {task.isProcessing ? 'Removing Metadata…' : 'Remove Metadata'}
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          <ResultActionBar
            title="Metadata Removed"
            subtitle={`Re-encoded ${results.length} image${results.length > 1 ? 's' : ''} locally.`}
            onStartOver={clearWorkspace}
            onDownloadAll={handleDownloadAll}
            downloadLabel={results.length === 1 ? 'Download Image' : 'Download ZIP'}
          />

          <div className="grid gap-3">
            {results.map((result) => (
              <Card
                key={result.name}
                className="flex flex-col gap-4 border-border/60 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted">
                    <Image
                      src={result.url}
                      alt={`${result.name} preview`}
                      fill
                      unoptimized
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold font-manrope">{result.name}</p>
                    <p className="text-[10px] text-muted-foreground font-dm-sans">
                      {result.width} × {result.height} px — {formatSize(result.originalSize)} →{' '}
                      {formatSize(result.scrubbedSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <HugeiconsIcon icon={Tick01Icon} className="size-3" aria-hidden />
                    Ready
                  </span>
                  <Button size="sm" variant="outline" asChild className="text-xs font-semibold">
                    <a href={result.url} download={result.name}>
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
          accent={tool.accent}
          message={task.message}
          progress={task.progress}
        />
      )}
    </ToolPageShell>
  );
}
