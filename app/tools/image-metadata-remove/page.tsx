'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import JSZip from 'jszip';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useWorker } from '@/lib/hooks/useWorker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  Download01Icon,
  Shield01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

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

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
}

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

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState<ScrubbedImage[]>([]);
  const [metadataByFile, setMetadataByFile] = useState<FileMetadata[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);

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
    setIsInspecting(true);

    try {
      const inspected: FileMetadata[] = [];
      for (const file of selectedFiles) {
        const response = await postTask<
          { buffer: ArrayBuffer; fileName: string; mimeType: string },
          { metadata: MetadataEntry[] }
        >('READ_IMAGE_METADATA', {
          buffer: await file.arrayBuffer(),
          fileName: file.name,
          mimeType: file.type,
        });

        inspected.push({
          fileName: file.name,
          entries: response.metadata,
        });
      }
      setMetadataByFile(inspected);
    } catch (err) {
      console.error(err);
      setProgressMessage('Could not inspect image metadata.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleScrubMetadata = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const nextResults: ScrubbedImage[] = [];

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        setProgressMessage(`Removing metadata from ${file.name}...`);
        setProgress(Math.round((index / files.length) * 100));

        const buffer = await file.arrayBuffer();
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
            buffer,
            fileName: file.name,
            mimeType: file.type,
            targetMimeType: file.type || 'image/png',
            quality: 92,
          },
          (pct) => {
            const base = (index / files.length) * 100;
            setProgress(Math.round(base + pct / files.length));
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

      setResults(nextResults);
      setProgress(100);
      setProgressMessage('Metadata removal complete.');
    } catch (err) {
      console.error(err);
      setProgressMessage('Image metadata removal failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;

    if (results.length === 1) {
      const link = document.createElement('a');
      link.href = results[0].url;
      link.download = results[0].name;
      link.click();
      return;
    }

    const zip = new JSZip();
    for (const result of results) {
      const response = await fetch(result.url);
      zip.file(result.name, await response.blob());
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = 'metadata_removed_images.zip';
    link.click();
    URL.revokeObjectURL(zipUrl);
  };

  const clearWorkspace = () => {
    setFiles([]);
    setResults([]);
    setMetadataByFile([]);
    setProgressMessage('');
  };

  const detectedMetadataCount = metadataByFile.reduce((sum, item) => sum + item.entries.length, 0);

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-teal-500/20 bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12 max-w-5xl">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
          Back to Tools
        </Link>

        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
              <HugeiconsIcon icon={Shield01Icon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Image Metadata Remover</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-2xl">
            Re-encode visible pixels to remove common embedded image metadata. This is a practical privacy scrub, not forensic sanitization.
          </p>
        </div>

        {results.length === 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FileUploadZone
                accept="image/*"
                multiple={true}
                onFilesSelected={handleFilesSelected}
                description="Upload images to scrub metadata"
              />
            </div>

            <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-5">
              <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                Privacy Scrub
              </h3>
              <p className="text-xs text-muted-foreground font-dm-sans leading-relaxed">
                The tool draws each image to canvas and exports fresh PNG, JPG, or WebP bytes. It removes common EXIF, GPS, camera, and software metadata embedded in the original file.
              </p>

              {files.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                      Selected Files ({files.length})
                    </span>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-border/50 bg-muted/20 p-2">
                      {files.map((file) => (
                        <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 py-1.5 text-xs font-dm-sans">
                          <span className="truncate font-semibold text-foreground/80">{file.name}</span>
                          <span className="shrink-0 text-muted-foreground">{formatSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/5 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-xs font-bold font-manrope">Metadata Found</h4>
                      <span className="rounded-md bg-teal-500/10 px-2 py-1 text-[10px] font-bold text-teal-700">
                        {isInspecting ? 'Scanning...' : `${detectedMetadataCount} item${detectedMetadataCount === 1 ? '' : 's'}`}
                      </span>
                    </div>

                    {isInspecting ? (
                      <p className="text-xs text-muted-foreground font-dm-sans">Reading embedded metadata from selected images...</p>
                    ) : detectedMetadataCount === 0 ? (
                      <p className="text-xs text-muted-foreground font-dm-sans">
                        No common EXIF, XMP, ICC, GPS, or text metadata was detected. Re-encoding will still output a fresh file.
                      </p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto pr-1">
                        {metadataByFile.map((item) => (
                          <div key={item.fileName} className="mb-3 last:mb-0">
                            <p className="mb-1 truncate text-[10px] font-bold text-foreground/80 font-dm-sans">
                              {item.fileName}
                            </p>
                            <div className="space-y-1">
                              {item.entries.map((entry) => (
                                <div key={`${item.fileName}-${entry.key}-${entry.value}`} className="rounded-lg border border-border/40 bg-background/70 p-2 text-xs font-dm-sans">
                                  <div className="font-semibold text-foreground">{entry.label}</div>
                                  <div className="truncate text-[10px] text-muted-foreground">{entry.value}</div>
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
                disabled={files.length === 0 || isProcessing || isInspecting}
                className="w-full font-semibold font-manrope bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/15"
              >
                {isProcessing ? 'Removing Metadata...' : 'Remove Metadata'}
              </Button>
            </Card>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-lg font-manrope">Metadata Removed</h3>
                <p className="text-xs text-muted-foreground font-dm-sans">
                  Re-encoded {results.length} image{results.length > 1 ? 's' : ''} locally.
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button variant="outline" size="sm" onClick={clearWorkspace} className="flex-1 text-xs font-semibold sm:flex-none">
                  Start Over
                </Button>
                <Button size="sm" onClick={handleDownloadAll} className="flex-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white sm:flex-none">
                  <HugeiconsIcon icon={Download01Icon} className="size-3.5 mr-1.5" />
                  {results.length === 1 ? 'Download Image' : 'Download ZIP'}
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {results.map((result) => (
                <Card key={result.name} className="p-4 border-border/60 bg-background/50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted">
                      <Image
                        src={result.url}
                        alt={`${result.name} preview`}
                        fill
                        unoptimized
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold font-manrope">{result.name}</p>
                      <p className="text-[10px] text-muted-foreground font-dm-sans">
                        {result.width} x {result.height} px - {formatSize(result.originalSize)} to {formatSize(result.scrubbedSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600">
                      <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                      Ready
                    </span>
                    <Button size="sm" variant="outline" asChild className="text-xs font-semibold">
                      <a href={result.url} download={result.name}>Download</a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="p-6 max-w-sm w-full mx-4 border-border/60 flex flex-col items-center gap-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
