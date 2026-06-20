'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useWorker } from '@/lib/hooks/useWorker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Image01Icon,
  Download01Icon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import JSZip from 'jszip';

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
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);

  const [file, setFile] = useState<PDFFile | null>(null);
  const [format, setFormat] = useState<string>('image/png'); // default PNG
  const [scale, setScale] = useState<string>('1.5'); // default 1.5x (around 108 DPI)
  const [quality, setQuality] = useState<number>(85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
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
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
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

      setProgressMessage('Initializing page conversion...');
      
      const response = await postTask<typeof payload, PDFImageResult>('PDF_TO_IMAGE', payload, (pct, msg) => {
        setProgress(pct);
        if (msg) setProgressMessage(msg);
      });

      const converted: ConvertedImage[] = response.images.map((img) => {
        const blob = new Blob([img.buffer], { type: format });
        const url = URL.createObjectURL(blob);
        return {
          pageIndex: img.pageIndex,
          url,
          fileName: `${baseName}_page_${img.pageIndex + 1}.${ext}`,
        };
      });

      setResults(converted);
      setProgress(100);
      setProgressMessage('Conversion complete!');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to convert PDF pages to images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0 || !file) return;

    if (results.length === 1) {
      const single = results[0];
      const link = document.createElement('a');
      link.href = single.url;
      link.download = single.fileName;
      link.click();
      return;
    }

    setIsProcessing(true);
    setProgress(30);
    setProgressMessage('Creating ZIP archive...');

    try {
      const zip = new JSZip();
      
      for (const item of results) {
        const response = await fetch(item.url);
        const blob = await response.blob();
        zip.file(item.fileName, blob);
      }

      setProgress(70);
      setProgressMessage('Compressing ZIP archive...');
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `${baseName}_pages.zip`;
      link.click();
      
      URL.revokeObjectURL(zipUrl);
      setProgress(100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearWorkspace = () => {
    setFile(null);
    setResults([]);
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
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <HugeiconsIcon icon={Image01Icon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">PDF to Image</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Convert document pages into sharp raster images (PNG or JPEG) locally.
          </p>
        </div>

        {results.length === 0 ? (
          !file ? (
            <FileUploadZone
              accept="application/pdf"
              multiple={false}
              onFilesSelected={handleFilesSelected}
              description="Upload PDF document to extract as images"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Options Panel */}
              <div className="md:col-span-2 flex flex-col gap-6">
                <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6">
                  <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                    Image settings
                  </h3>

                  {/* Format selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground/80 font-dm-sans">
                      Target Format:
                    </label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Select image format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image/png">PNG (Lossless / High Quality)</SelectItem>
                        <SelectItem value="image/jpeg">JPEG (Lossy / Smaller Size)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resolution scale selector */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground/80 font-dm-sans">
                      Resolution Scale:
                    </label>
                    <Select value={scale} onValueChange={setScale}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Select resolution scale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.0">1.0x (Standard screen - 72 DPI)</SelectItem>
                        <SelectItem value="1.5">1.5x (Medium quality - 108 DPI)</SelectItem>
                        <SelectItem value="2.0">2.0x (High print quality - 144 DPI)</SelectItem>
                        <SelectItem value="3.0">3.0x (Ultra print quality - 216 DPI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality slider for JPEG */}
                  {format === 'image/jpeg' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-semibold font-dm-sans">
                        <span>JPEG Compression Quality:</span>
                        <span className="text-primary">{quality}%</span>
                      </div>
                      <div className="px-1">
                        <input
                          type="range"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                          min={20}
                          max={100}
                          step={5}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Sidebar controls */}
              <div className="md:col-span-1">
                <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6 sticky top-6">
                  <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                    Document details
                  </h3>
                  <div className="flex flex-col gap-2.5 text-xs text-muted-foreground font-dm-sans">
                    <span className="truncate block">Name: <strong className="text-foreground">{file.name}</strong></span>
                    <span>Size: <strong>{(file.size / 1024 / 1024).toFixed(2)} MB</strong></span>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                    <Button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="w-full font-semibold font-manrope"
                    >
                      Convert PDF Pages
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
          )
        ) : (
          /* Converted Grid Results View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="font-bold text-lg font-manrope">Extraction Complete</h3>
                <p className="text-xs text-muted-foreground font-dm-sans">
                  Extracted {results.length} page{results.length > 1 ? 's' : ''} successfully.
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearWorkspace}
                  className="text-xs font-semibold flex-1 sm:flex-none"
                >
                  Start Over
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleDownloadAll} 
                  className="text-xs font-semibold flex-1 sm:flex-none shadow-lg shadow-primary/10"
                >
                  <HugeiconsIcon icon={Download01Icon} className="size-3.5 mr-1.5" />
                  {results.length === 1 ? 'Download Image' : 'Download All (.zip)'}
                </Button>
              </div>
            </div>

            {/* Results images grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {results.map((item) => (
                <Card key={item.pageIndex} className="p-4 border-border/60 bg-background/50 flex flex-col gap-3 justify-between">
                  <div className="aspect-[3/4] bg-muted/40 rounded-lg overflow-hidden border border-border/40 flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`Page ${item.pageIndex + 1}`}
                      className="max-w-full max-h-full object-contain shadow-sm rounded"
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate font-manrope">
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
                    className="text-xs font-semibold w-full"
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
