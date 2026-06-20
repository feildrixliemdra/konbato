'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);

  const [file, setFile] = useState<PDFFile | null>(null);
  const [compressionMode, setCompressionMode] = useState<'light' | 'deep'>('light');
  const [quality, setQuality] = useState<number>(60);
  const [dpi, setDpi] = useState<number>(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<CompressedResult | null>(null);

  useEffect(() => {
    return () => {
      if (result?.blobUrl) {
        URL.revokeObjectURL(result.blobUrl);
      }
    };
  }, [result]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setResult(null);

    const targetFile = selectedFiles[0];
    const buffer = await targetFile.arrayBuffer();

    setFile({
      name: targetFile.name,
      size: targetFile.size,
      buffer,
    });
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const isDeep = compressionMode === 'deep';
      const type = isDeep ? 'COMPRESS_DEEP' : 'COMPRESS_LIGHT';
      const payload = isDeep 
        ? { buffer: file.buffer.slice(0), quality, dpi }
        : { buffer: file.buffer.slice(0) };

      setProgressMessage(isDeep ? 'Rasterizing and compressing pages...' : 'Scrubbing metadata and structures...');
      
      const response = await postTask<typeof payload, PDFWorkerResult>(type, payload, (pct, msg) => {
        setProgress(pct);
        if (msg) setProgressMessage(msg);
      });

      const blob = new Blob([response.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResult({
        name: file.name,
        originalSize: file.size,
        compressedSize: blob.size,
        blobUrl: url,
      });

      setProgress(100);
      setProgressMessage('Compression complete!');
    } catch (err) {
      console.error(err);
      setProgressMessage('PDF compression failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearWorkspace = () => {
    setFile(null);
    setResult(null);
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
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <HugeiconsIcon icon={ArrowShrink01Icon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Compress PDF</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Reduce PDF file sizes client-side. Select between metadata cleaning or deep rasterization.
          </p>
        </div>

        {!file ? (
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to compress"
          />
        ) : !result ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Options Selector */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
                <h3 className="font-bold text-sm font-manrope">Compression Mode</h3>
                
                {/* Tab buttons */}
                <div className="flex gap-1.5 p-1 bg-muted/40 border border-border/40 rounded-xl">
                  <button
                    onClick={() => setCompressionMode('light')}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      compressionMode === 'light'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Light (Lossless)
                  </button>
                  <button
                    onClick={() => setCompressionMode('deep')}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      compressionMode === 'deep'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Deep (Rasterize)
                  </button>
                </div>
              </div>

              {/* Light Mode Description */}
              {compressionMode === 'light' && (
                <div className="rounded-2xl border border-border/60 bg-muted/5 p-6 flex flex-col gap-4">
                  <h4 className="font-bold text-sm font-manrope text-foreground">Light Lossless Compression</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-dm-sans">
                    Light compression keeps all text and vector graphics 100% vector-sharp and searchable. 
                    It works by:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1.5 font-dm-sans">
                    <li>Purging document metadata (author, created date, software producer, etc.)</li>
                    <li>Removing duplicate internal resources (like fonts loaded multiple times)</li>
                    <li>Compacting cross-reference table objects</li>
                    <li>Running clean garbage collection on unreferenced objects</li>
                  </ul>
                  <span className="text-xs text-amber-600 bg-amber-500/10 px-3 py-2 rounded-lg mt-2 font-dm-sans font-semibold">
                    Ideal for: Text-heavy contracts, official receipts, and vector drawings.
                  </span>
                </div>
              )}

              {/* Deep Mode Controls */}
              {compressionMode === 'deep' && (
                <div className="rounded-2xl border border-border/60 bg-muted/5 p-6 flex flex-col gap-6">
                  <div>
                    <h4 className="font-bold text-sm font-manrope text-foreground">Deep Rasterized Compression</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-dm-sans mt-1">
                      Deep compression flattens pages into raster images to maximize size reduction. 
                      <strong> Note: Text selection is removed</strong>, but size decreases drastically.
                    </p>
                  </div>

                  {/* Quality Slider */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-semibold font-dm-sans">
                      <span>Image Quality:</span>
                      <span className="text-primary">{quality}%</span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        min={10}
                        max={90}
                        step={5}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-dm-sans leading-relaxed">
                      Lower values yield smaller PDF sizes but more visible image compression artifacts.
                    </span>
                  </div>

                  {/* DPI Slider */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-semibold font-dm-sans">
                      <span>Rendering DPI (Resolution):</span>
                      <span className="text-primary">{dpi} DPI</span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        value={dpi}
                        onChange={(e) => setDpi(parseInt(e.target.value))}
                        min={72}
                        max={200}
                        step={2}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-dm-sans leading-relaxed">
                      Standard screen display is 72–150 DPI. 150 DPI is recommended for readable scans.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Summary */}
            <div className="md:col-span-1">
              <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6 sticky top-6">
                <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                  Document Details
                </h3>

                <div className="flex flex-col gap-2.5 text-xs text-muted-foreground font-dm-sans">
                  <span>Name: <strong className="text-foreground truncate block">{file.name}</strong></span>
                  <span>Original Size: <strong>{formatSize(file.size)}</strong></span>
                  <span>Method: <strong>{compressionMode === 'light' ? 'Lossless Vector Clean' : 'Deep Page Raster'}</strong></span>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                  <Button
                    onClick={handleCompress}
                    disabled={isProcessing}
                    className="w-full font-semibold font-manrope bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/15"
                  >
                    Start Compression
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
          /* Output Success Comparison State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-xl mx-auto flex flex-col gap-6"
          >
            <div className="border border-border/60 bg-background/50 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center gap-6 shadow-xl">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <HugeiconsIcon icon={Tick01Icon} className="size-7" />
              </div>

              <div className="flex flex-col gap-2 text-center">
                <h3 className="font-bold text-2xl font-manrope">Compression Complete</h3>
                <p className="text-sm text-muted-foreground font-dm-sans">
                  Your document has been optimized client-side.
                </p>
              </div>

              {/* Compression Stats Grid */}
              <div className="w-full grid grid-cols-3 border border-border/50 bg-muted/20 rounded-xl divide-x divide-border/50 text-center font-dm-sans overflow-hidden">
                <div className="py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold">ORIGINAL</span>
                  <span className="text-sm font-bold text-foreground">{formatSize(result.originalSize)}</span>
                </div>
                <div className="py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold">COMPRESSED</span>
                  <span className="text-sm font-bold text-emerald-600">{formatSize(result.compressedSize)}</span>
                </div>
                <div className="py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold">REDUCTION</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {result.originalSize > result.compressedSize
                      ? `${Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                <Button
                  variant="outline"
                  onClick={clearWorkspace}
                  className="flex-1 font-semibold text-xs py-5"
                >
                  Compress New File
                </Button>
                <Button
                  asChild
                  className="flex-1 font-semibold text-xs py-5 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/15"
                >
                  <a href={result.blobUrl} download={`compressed_${result.name}`}>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
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
