'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useWorker } from '@/lib/hooks/useWorker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowShrink01Icon,
  Download01Icon,
  ArrowLeft01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import JSZip from 'jszip';

interface ProcessedFile {
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  ratio: number;
}

export default function ImageCompressPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask } = useWorker(createWorker);

  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState<number>(75);
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState<ProcessedFile[]>([]);

  useEffect(() => {
    return () => {
      results.forEach((item) => {
        if (item.compressedUrl) {
          URL.revokeObjectURL(item.compressedUrl);
        }
      });
    };
  }, [results]);

  // Create temporary URLs for previewing uploaded files
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFileUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResults([]);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const compressedResults: ProcessedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const originalUrl = fileUrls[i] || URL.createObjectURL(file);
        
        setProgressMessage(`Optimizing ${file.name}...`);
        setProgress(Math.round((i / files.length) * 100));

        const arrayBuffer = await file.arrayBuffer();
        
        const payload = {
          buffer: arrayBuffer,
          fileName: file.name,
          quality: quality,
          mimeType: file.type,
          width: resizeWidth ? parseInt(resizeWidth, 10) : undefined,
          height: resizeHeight ? parseInt(resizeHeight, 10) : undefined,
        };

        const result: any = await postTask('COMPRESS', payload, (p) => {
          // Adjust worker internal progress to overall progress
          const workerWeight = 1 / files.length;
          const currentBase = (i / files.length) * 100;
          setProgress(Math.round(currentBase + p * workerWeight));
        });

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
              (b) => {
                if (b) resolve(b);
                else reject(new Error('Canvas toBlob failed'));
              },
              result.mimeType,
              quality / 100
            );
          });
          result.bitmap.close();
        } else {
          outBlob = new Blob([result.buffer], { type: result.mimeType });
        }
        const compressedUrl = URL.createObjectURL(outBlob);

        compressedResults.push({
          name: file.name,
          originalSize: file.size,
          compressedSize: outBlob.size,
          originalUrl,
          compressedUrl,
          ratio: Math.round(((file.size - outBlob.size) / file.size) * 100),
        });
      }

      setResults(compressedResults);
      setProgress(100);
      setProgressMessage('Compression complete!');
    } catch (err) {
      console.error(err);
      setProgressMessage('Compression failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    
    if (results.length === 1) {
      const item = results[0];
      const link = document.createElement('a');
      link.href = item.compressedUrl;
      link.download = `optimized_${item.name}`;
      link.click();
      return;
    }

    const zip = new JSZip();
    for (const item of results) {
      const response = await fetch(item.compressedUrl);
      const blob = await response.blob();
      zip.file(`optimized_${item.name}`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = 'optimized_images.zip';
    link.click();
    URL.revokeObjectURL(zipUrl);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-primary/20 bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
          Back to Tools
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <HugeiconsIcon icon={ArrowShrink01Icon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Image Compress</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Shrink image file sizes without sacrificing quality. Handles JPEG, PNG, WEBP, GIF, and TIFF entirely on your browser.
          </p>
        </div>

        {results.length === 0 ? (
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
              <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6">
                <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                  Settings
                </h3>

                {/* Quality Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold font-dm-sans">
                    <span className="text-foreground/80">Quality</span>
                    <span className="text-primary">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                    disabled={isProcessing}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] text-muted-foreground font-dm-sans">
                    Recommended: 70% - 85% for best compression-to-quality ratio.
                  </span>
                </div>

                {/* Dimensions Resize */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Resize Dimensions (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-dm-sans">Width (px)</span>
                      <input
                        type="number"
                        placeholder="Auto"
                        value={resizeWidth}
                        onChange={(e) => setResizeWidth(e.target.value)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-dm-sans">Height (px)</span>
                      <input
                        type="number"
                        placeholder="Auto"
                        value={resizeHeight}
                        onChange={(e) => setResizeHeight(e.target.value)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleCompress}
                  disabled={files.length === 0 || isProcessing}
                  className="w-full font-semibold font-manrope"
                >
                  {isProcessing ? 'Optimizing...' : 'Compress Images'}
                </Button>
              </Card>
            </div>
          </div>
        ) : (
          /* Results Dashboard */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="font-bold text-lg font-manrope">Compression Complete</h3>
                <p className="text-xs text-muted-foreground font-dm-sans">
                  Optimized {results.length} image{results.length > 1 ? 's' : ''} successfully.
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiles([]);
                    setResults([]);
                  }}
                  className="text-xs font-semibold flex-1 sm:flex-none"
                >
                  Start Over
                </Button>
                <Button size="sm" onClick={handleDownloadAll} className="text-xs font-semibold flex-1 sm:flex-none">
                  <HugeiconsIcon icon={Download01Icon} className="size-3.5 mr-1.5" />
                  {results.length === 1 ? 'Download Image' : 'Download All (.zip)'}
                </Button>
              </div>
            </div>

            {/* Results Grid List */}
            <div className="flex flex-col gap-3">
              {results.map((item, idx) => (
                <Card key={idx} className="p-4 border-border/60 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Preview Thumbnail */}
                    <div className="size-12 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/40 relative">
                      <img
                        src={item.compressedUrl}
                        alt="Compressed preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate font-manrope">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-dm-sans">
                        <span>Original: {formatSize(item.originalSize)}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">
                          Compressed: {formatSize(item.compressedSize)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                      <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                      Save {item.ratio}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="text-xs font-semibold"
                    >
                      <a href={item.compressedUrl} download={`optimized_${item.name}`}>
                        Download
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="p-6 max-w-sm w-full mx-4 border-border/60 flex flex-col items-center gap-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
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
