'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import JSZip from 'jszip';

interface ProcessedFile {
  name: string;
  originalSize: number;
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

export default function ImageConvertPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask } = useWorker(createWorker);

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('image/png'); // default to PNG
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState<ProcessedFile[]>([]);

  useEffect(() => {
    return () => {
      results.forEach((item) => {
        if (item.convertedUrl) {
          URL.revokeObjectURL(item.convertedUrl);
        }
      });
    };
  }, [results]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResults([]);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const convertedResults: ProcessedFile[] = [];
    const extMapping: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    const targetExt = extMapping[targetFormat] || 'png';

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setProgressMessage(`Converting ${file.name}...`);
        setProgress(Math.round((i / files.length) * 100));

        const arrayBuffer = await file.arrayBuffer();
        
        const payload = {
          buffer: arrayBuffer,
          fileName: file.name,
          targetMimeType: targetFormat,
        };

        const result = await postTask<typeof payload, ImageWorkerResult>('CONVERT', payload, (p) => {
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
            const hasQuality = targetFormat === 'image/jpeg' || targetFormat === 'image/webp';
            canvas.toBlob(
              (b) => {
                if (b) resolve(b);
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
        const convertedUrl = URL.createObjectURL(outBlob);

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

        convertedResults.push({
          name: `${baseName}.${targetExt}`,
          originalSize: file.size,
          convertedUrl,
          targetFormat: targetExt.toUpperCase(),
        });
      }

      setResults(convertedResults);
      setProgress(100);
      setProgressMessage('Conversion complete!');
    } catch (err) {
      console.error(err);
      setProgressMessage('Conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    
    if (results.length === 1) {
      const item = results[0];
      const link = document.createElement('a');
      link.href = item.convertedUrl;
      link.download = item.name;
      link.click();
      return;
    }

    const zip = new JSZip();
    for (const item of results) {
      const response = await fetch(item.convertedUrl);
      const blob = await response.blob();
      zip.file(item.name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = 'converted_images.zip';
    link.click();
    URL.revokeObjectURL(zipUrl);
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
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Image Converter</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Convert JPG, PNG, WEBP, GIF, and TIFF images to your desired format. All processing is completed locally.
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
                description="Upload images to convert (JPG, PNG, WEBP, GIF, TIFF)"
              />
            </div>

            {/* Options Panel */}
            <div className="md:col-span-1">
              <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6">
                <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                  Settings
                </h3>

                {/* Target Format Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Convert To:
                  </label>
                  <Select value={targetFormat} onValueChange={setTargetFormat} disabled={isProcessing}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select target format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/png">PNG (Lossless)</SelectItem>
                      <SelectItem value="image/jpeg">JPG / JPEG (Lossy)</SelectItem>
                      <SelectItem value="image/webp">WEBP (Modern / Small)</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground font-dm-sans leading-relaxed">
                    Note: Converting to PNG will yield a larger file size due to lossless compression.
                  </span>
                </div>

                <Button
                  onClick={handleConvert}
                  disabled={files.length === 0 || isProcessing}
                  className="w-full font-semibold font-manrope"
                >
                  {isProcessing ? 'Converting...' : 'Convert Images'}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="font-bold text-lg font-manrope">Conversion Complete</h3>
                <p className="text-xs text-muted-foreground font-dm-sans">
                  Converted {results.length} image{results.length > 1 ? 's' : ''} successfully.
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

            <div className="flex flex-col gap-3">
              {results.map((item, idx) => (
                <Card key={idx} className="p-4 border-border/60 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/40 relative">
                      <Image
                        src={item.convertedUrl}
                        alt="Converted preview"
                        fill
                        unoptimized
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate font-manrope">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-dm-sans">
                        {item.targetFormat} Format • Ready
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                      <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                      Success
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="text-xs font-semibold"
                    >
                      <a href={item.convertedUrl} download={item.name}>
                        Download
                      </a>
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
