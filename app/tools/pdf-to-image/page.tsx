'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { ResultActionBar } from '@/components/tools/result-action-bar';
import { LabeledSlider } from '@/components/tools/labeled-slider';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ACCENTS, requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';
import { downloadResults } from '@/lib/download';
import { motion } from 'framer-motion';

const tool = requireTool('pdf-to-image');

interface PDFFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

interface ConvertedImage {
  pageIndex: number;
  url: string;
  fileName: string;
}

interface PDFImageResult {
  images: {
    pageIndex: number;
    buffer: ArrayBuffer;
  }[];
}

export default function PDFToImagePage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
      type: 'module',
    });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PDFFile | null>(null);
  const [format, setFormat] = useState<string>('image/png'); // default PNG
  const [scale, setScale] = useState<string>('1.5'); // default 1.5x (around 108 DPI)
  const [quality, setQuality] = useState<number>(85);
  const [results, setResults] = useState<ConvertedImage[]>([]);

  useEffect(() => {
    return () => {
      results.forEach((item) => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [results]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setResults([]);
    task.clearError();

    const targetFile = selectedFiles[0];
    const buffer = await targetFile.arrayBuffer();

    setFile({
      name: targetFile.name,
      size: targetFile.size,
      buffer,
    });
  };

  const handleConvert = async () => {
    if (!file) return;

    const converted = await task.runTask(
      async (report) => {
        const scaleNum = parseFloat(scale);
        const isJpeg = format === 'image/jpeg';
        const ext = isJpeg ? 'jpg' : 'png';
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

        const payload = {
          buffer: file.buffer.slice(0),
          format,
          quality,
          scale: scaleNum,
        };

        report(0, 'Initializing page conversion…');

        const response = await postTask<typeof payload, PDFImageResult>(
          'PDF_TO_IMAGE',
          payload,
          (pct, msg) => report(pct, msg)
        );

        return response.images.map((img) => {
          const blob = new Blob([img.buffer], { type: format });
          const url = URL.createObjectURL(blob);
          return {
            pageIndex: img.pageIndex,
            url,
            fileName: `${baseName}_page_${img.pageIndex + 1}.${ext}`,
          };
        });
      },
      {
        initialMessage: 'Initializing page conversion…',
        errorMessage: 'Failed to convert PDF pages to images.',
      }
    );

    if (converted.ok) setResults(converted.value);
  };

  const handleDownloadAll = () => {
    if (results.length === 0 || !file) return;

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    downloadResults(
      results.map((item) => ({ name: item.fileName, url: item.url })),
      `${baseName}_pages.zip`
    );
  };

  const clearWorkspace = () => {
    setFile(null);
    setResults([]);
    task.reset();
  };

  return (
    <ToolPageShell
      title={tool.title}
      description={tool.description}
      icon={tool.icon}
      accent={tool.accent}
    >
      {results.length === 0 ? (
        !file ? (
          <div className="flex flex-col gap-6">
            <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
            <FileUploadZone
              accept="application/pdf"
              multiple={false}
              onFilesSelected={handleFilesSelected}
              description="Upload PDF document to extract as images"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
            <div className="grid gap-6 md:grid-cols-3">
              {/* Options Panel */}
              <div className="flex flex-col gap-6 md:col-span-2">
                <Card className="flex flex-col gap-6 border-border/60 bg-background/50 p-6 backdrop-blur-sm">
                  <h2 className="border-b border-border/40 pb-3 text-sm font-bold font-manrope">
                    Image settings
                  </h2>

                  {/* Format selector */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="pdf-image-format"
                      className="text-xs font-semibold text-foreground/80 font-dm-sans"
                    >
                      Target Format:
                    </label>
                    <Select
                      value={format}
                      onValueChange={setFormat}
                      disabled={task.isProcessing}
                    >
                      <SelectTrigger id="pdf-image-format" className="h-10 w-full">
                        <SelectValue placeholder="Select image format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image/png">
                          PNG (Lossless / High Quality)
                        </SelectItem>
                        <SelectItem value="image/jpeg">
                          JPEG (Lossy / Smaller Size)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resolution scale selector */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="pdf-image-scale"
                      className="text-xs font-semibold text-foreground/80 font-dm-sans"
                    >
                      Resolution Scale:
                    </label>
                    <Select
                      value={scale}
                      onValueChange={setScale}
                      disabled={task.isProcessing}
                    >
                      <SelectTrigger id="pdf-image-scale" className="h-10 w-full">
                        <SelectValue placeholder="Select resolution scale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.0">
                          1.0x (Standard screen - 72 DPI)
                        </SelectItem>
                        <SelectItem value="1.5">
                          1.5x (Medium quality - 108 DPI)
                        </SelectItem>
                        <SelectItem value="2.0">
                          2.0x (High print quality - 144 DPI)
                        </SelectItem>
                        <SelectItem value="3.0">
                          3.0x (Ultra print quality - 216 DPI)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality slider for JPEG */}
                  {format === 'image/jpeg' && (
                    <LabeledSlider
                      id="pdf-image-quality"
                      label="JPEG Compression Quality:"
                      value={quality}
                      min={20}
                      max={100}
                      step={5}
                      unit="%"
                      onChange={setQuality}
                      disabled={task.isProcessing}
                    />
                  )}
                </Card>
              </div>

              {/* Sidebar controls */}
              <div className="md:col-span-1">
                <Card className="sticky top-6 flex flex-col gap-6 border-border/60 bg-background/50 p-6 backdrop-blur-sm">
                  <h2 className="border-b border-border/40 pb-3 text-sm font-bold font-manrope">
                    Document details
                  </h2>
                  <div className="flex flex-col gap-2.5 text-xs text-muted-foreground font-dm-sans">
                    <span className="block truncate">
                      Name:{' '}
                      <strong className="text-foreground">{file.name}</strong>
                    </span>
                    <span>
                      Size: <strong>{formatSize(file.size)}</strong>
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border/40 pt-2">
                    <Button
                      onClick={handleConvert}
                      disabled={task.isProcessing}
                      className={`w-full font-semibold font-manrope ${ACCENTS[tool.accent].button}`}
                    >
                      Convert PDF Pages
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
          </div>
        )
      ) : (
        /* Converted Grid Results View */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          <ResultActionBar
            title="Extraction Complete"
            subtitle={`Extracted ${results.length} page${
              results.length > 1 ? 's' : ''
            } successfully.`}
            onStartOver={clearWorkspace}
            onDownloadAll={handleDownloadAll}
            downloadLabel={results.length === 1 ? 'Download Image' : 'Download All (.zip)'}
          />

          {/* Results images grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {results.map((item) => (
              <Card
                key={item.pageIndex}
                className="flex flex-col justify-between gap-3 border-border/60 bg-background/50 p-4"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                  <Image
                    src={item.url}
                    alt={`Page ${item.pageIndex + 1}`}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="rounded object-contain p-2 shadow-sm"
                  />
                </div>

                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-bold text-foreground font-manrope">
                    {item.fileName}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-dm-sans">
                    Page {item.pageIndex + 1}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="w-full text-xs font-semibold"
                >
                  <a href={item.url} download={item.fileName}>
                    Download page
                  </a>
                </Button>
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
