'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ColorsIcon,
  Download01Icon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

export default function ImageRemoveBgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [cutoutUrl, setCutoutUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Track visual comparison slider percentage (0 to 100)
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Cache download confirmation states
  const [isModelDownloaded, setIsModelDownloaded] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const downloaded = localStorage.getItem('konbato_bg_model_downloaded') === 'true';
      setIsModelDownloaded(downloaded);
    }
  }, []);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    return () => {
      if (cutoutUrl) {
        URL.revokeObjectURL(cutoutUrl);
      }
    };
  }, [cutoutUrl]);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCutoutUrl('');
    } else {
      setFile(null);
      setCutoutUrl('');
    }
  };

  const handleRemoveBackgroundClick = () => {
    if (isModelDownloaded) {
      startProcessing();
    } else {
      setShowConfirmDialog(true);
    }
  };

  const startProcessing = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const cached = isModelDownloaded;
    setProgress(cached ? 15 : 0);
    setProgressMessage(
      cached 
        ? 'Loading model weights from local cache...' 
        : 'Initializing neural network engine...'
    );

    try {
      // Lazy load the library on user action to keep initial bundle light
      const { removeBackground } = await import('@imgly/background-removal');

      if (!cached) {
        setProgressMessage('Downloading model weights (~25MB)...');
      } else {
        setProgressMessage('Loading model from cache...');
      }
      
      const config = {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const percent = Math.round((current / total) * 100);
            if (key.includes('fetch')) {
              setProgressMessage(`Downloading model weights: ${percent}%`);
              setProgress(Math.round(percent * 0.4)); // First 40% of progress
            } else if (key.includes('compute') || key.includes('processing')) {
              setProgressMessage('Isolating foreground subject...');
              setProgress(Math.round(40 + percent * 0.6)); // Remaining 60%
            }
          }
        },
      };

      const outBlob = await removeBackground(file, config);
      const url = URL.createObjectURL(outBlob);
      setCutoutUrl(url);
      setProgress(100);
      setProgressMessage('Background removed successfully!');
      
      // Save cache flag
      localStorage.setItem('konbato_bg_model_downloaded', 'true');
      setIsModelDownloaded(true);
    } catch (err) {
      console.error(err);
      setProgressMessage(err instanceof Error ? err.message : 'Processing failed. Your device might lack required WebGL/WASM support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    const container = document.getElementById('comparison-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, position)));
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
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <HugeiconsIcon icon={ColorsIcon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Remove Background</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Isolate subjects from photos 100% locally in your browser. Runs a local AI segmentation model with zero server uploads.
          </p>
        </div>

        {!cutoutUrl ? (
          <div className="flex flex-col gap-6">
            <FileUploadZone
              accept="image/*"
              multiple={false}
              onFilesSelected={handleFilesSelected}
              description="Upload a photo to remove background"
            />
            {file && (
              <div className="flex justify-end">
                <Button
                  onClick={handleRemoveBackgroundClick}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 font-semibold font-manrope bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/15"
                >
                  Remove Background
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Slider Comparison Output */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="font-bold text-lg font-manrope">Background Removed</h3>
                <p className="text-xs text-muted-foreground font-dm-sans">
                  Drag the slider to compare original and cutout images.
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setCutoutUrl('');
                  }}
                  className="text-xs font-semibold flex-1 sm:flex-none"
                >
                  Start Over
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none"
                >
                  <a href={cutoutUrl} download={`cutout_${file?.name}`}>
                    <HugeiconsIcon icon={Download01Icon} className="size-3.5 mr-1.5" />
                    Download PNG
                  </a>
                </Button>
              </div>
            </div>

            {/* Slider Comparison Component */}
            <div
              id="comparison-container"
              className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-border/80 bg-muted/40 cursor-ew-resize select-none"
              style={{ touchAction: 'none' }}
              onMouseMove={(e) => isDraggingSlider && handleSliderMove(e)}
              onTouchMove={(e) => isDraggingSlider && handleSliderMove(e)}
              onMouseDown={() => setIsDraggingSlider(true)}
              onTouchStart={() => setIsDraggingSlider(true)}
              onMouseUp={() => setIsDraggingSlider(false)}
              onMouseLeave={() => setIsDraggingSlider(false)}
              onTouchEnd={() => setIsDraggingSlider(false)}
            >
              {/* Underneath: Transparent Cutout Image */}
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-muted/5 flex items-center justify-center">
                <Image
                  src={cutoutUrl}
                  alt="Cutout background removed"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain pointer-events-none"
                />
              </div>

              {/* Overlaid: Original Image (Clipped) */}
              <div
                className="absolute inset-0 bg-background/5 flex items-center justify-center overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <Image
                  src={originalUrl}
                  alt="Original image"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain pointer-events-none"
                />
              </div>

              {/* Sliding Separator Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg border border-white/20 select-none">
                  <span className="text-[10px] font-bold">↔</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="p-6 max-w-sm w-full mx-4 border-border/60 flex flex-col items-center gap-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="p-6 max-w-md w-full mx-4 border-border/60 flex flex-col gap-4 shadow-2xl bg-background/90">
              <div className="flex items-center gap-3 text-indigo-500">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <HugeiconsIcon icon={ColorsIcon} className="size-5" />
                </div>
                <h3 className="text-lg font-bold font-manrope text-foreground">One-Time Download Required</h3>
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground font-dm-sans leading-relaxed">
                This tool isolates subjects using a neural network running <strong>entirely inside your browser</strong>. 
                To start, your browser needs to download the model weights file (<strong>~25MB</strong>).
              </p>
              
              <div className="rounded-lg bg-muted/40 border border-border/40 p-3 flex flex-col gap-1.5 text-xs text-muted-foreground font-dm-sans">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>100% secure: files are never uploaded to servers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Offline-ready: once cached, runs without internet</span>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    startProcessing();
                  }}
                  className="flex-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/15"
                >
                  Download & Process
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
