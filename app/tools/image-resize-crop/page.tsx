'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
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
  ArrowLeft01Icon,
  Download01Icon,
  ImageCropIcon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

interface ImageWorkerResult {
  buffer: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startCrop: CropBox;
}

const outputExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function getBaseName(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
}

function centeredCrop(width: number, height: number, ratio: number): CropBox {
  const currentRatio = width / height;
  if (currentRatio > ratio) {
    const cropWidth = Math.round(height * ratio);
    return { x: Math.round((width - cropWidth) / 2), y: 0, width: cropWidth, height };
  }

  const cropHeight = Math.round(width / ratio);
  return { x: 0, y: Math.round((height - cropHeight) / 2), width, height: cropHeight };
}

function clampCrop(box: CropBox, sourceWidth: number, sourceHeight: number): CropBox {
  const width = Math.max(1, Math.min(Math.round(box.width), sourceWidth));
  const height = Math.max(1, Math.min(Math.round(box.height), sourceHeight));
  return {
    x: Math.max(0, Math.min(Math.round(box.x), sourceWidth - width)),
    y: Math.max(0, Math.min(Math.round(box.y), sourceHeight - height)),
    width,
    height,
  };
}

export default function ImageResizeCropPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask } = useWorker(createWorker);
  const cropFrameRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const [preset, setPreset] = useState('Original');
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 1, height: 1 });
  const [cropZoom, setCropZoom] = useState(1);
  const [targetWidth, setTargetWidth] = useState('');
  const [targetHeight, setTargetHeight] = useState('');
  const [targetFormat, setTargetFormat] = useState('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; width: number; height: number } | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [sourceUrl, result]);

  const outputName = useMemo(() => {
    if (!file) return 'resized-image.png';
    return `resized_${getBaseName(file.name)}.${outputExtensions[targetFormat] || 'png'}`;
  }, [file, targetFormat]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    const selected = selectedFiles[0];
    if (!selected) return;
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    const url = URL.createObjectURL(selected);
    setFile(selected);
    setSourceUrl(url);
    setResult(null);
    setPreset('Original');

    const image = new Image();
    image.onload = () => {
      setSourceSize({ width: image.naturalWidth, height: image.naturalHeight });
      setCrop({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight });
      setCropZoom(1);
      setTargetWidth(String(image.naturalWidth));
      setTargetHeight(String(image.naturalHeight));
    };
    image.src = url;
  };

  const applyPreset = (value: string) => {
    setPreset(value);
    if (!sourceSize.width || !sourceSize.height) return;

    const ratios: Record<string, number> = {
      '1:1': 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
    };

    const nextCrop = value === 'Original'
      ? { x: 0, y: 0, width: sourceSize.width, height: sourceSize.height }
      : ratios[value]
        ? centeredCrop(sourceSize.width, sourceSize.height, ratios[value])
        : crop;

    setCrop(nextCrop);
    setCropZoom(1);
    setTargetWidth(String(nextCrop.width));
    setTargetHeight(String(nextCrop.height));
  };

  const updateCropField = (key: keyof CropBox, value: string) => {
    setPreset('Custom');
    setCrop((current) =>
      clampCrop(
        { ...current, [key]: Math.max(0, Number(value) || 0) },
        sourceSize.width || current.width,
        sourceSize.height || current.height
      )
    );
  };

  const applyCropZoom = (value: number) => {
    if (!sourceSize.width || !sourceSize.height) return;

    const nextZoom = Math.max(1, Math.min(4, value));
    const ratio = crop.width / crop.height || sourceSize.width / sourceSize.height;
    const maxCrop = centeredCrop(sourceSize.width, sourceSize.height, ratio);
    const nextWidth = maxCrop.width / nextZoom;
    const nextHeight = maxCrop.height / nextZoom;
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;

    setCropZoom(nextZoom);
    setCrop(
      clampCrop(
        {
          x: centerX - nextWidth / 2,
          y: centerY - nextHeight / 2,
          width: nextWidth,
          height: nextHeight,
        },
        sourceSize.width,
        sourceSize.height
      )
    );
    setTargetWidth(String(Math.round(nextWidth)));
    setTargetHeight(String(Math.round(nextHeight)));
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!sourceSize.width || !sourceSize.height || result || isProcessing) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    };
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const frame = cropFrameRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !frame) return;

    const rect = frame.getBoundingClientRect();
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setCrop(
      clampCrop(
        {
          ...dragState.startCrop,
          x: dragState.startCrop.x - deltaX * (dragState.startCrop.width / rect.width),
          y: dragState.startCrop.y - deltaY * (dragState.startCrop.height / rect.height),
        },
        sourceSize.width,
        sourceSize.height
      )
    );
  };

  const handleCropPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setProgressMessage('Preparing resize and crop...');

    try {
      const response = await postTask<
        {
          buffer: ArrayBuffer;
          fileName: string;
          mimeType: string;
          targetMimeType: string;
          crop: CropBox;
          targetWidth: number;
          targetHeight: number;
          quality: number;
        },
        ImageWorkerResult
      >(
        'RESIZE_CROP',
        {
          buffer: await file.arrayBuffer(),
          fileName: file.name,
          mimeType: file.type,
          targetMimeType: targetFormat,
          crop,
          targetWidth: Number(targetWidth) || crop.width,
          targetHeight: Number(targetHeight) || crop.height,
          quality: 90,
        },
        (pct, message) => {
          setProgress(pct);
          if (message) setProgressMessage(message);
        }
      );

      const blob = new Blob([response.buffer], { type: response.mimeType });
      const url = URL.createObjectURL(blob);
      setResult({ url, name: outputName, width: response.width, height: response.height });
      setProgress(100);
      setProgressMessage('Resize and crop complete!');
    } catch (error) {
      console.error(error);
      setProgressMessage('Resize and crop failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSourceSize({ width: 0, height: 0 });
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setCropZoom(1);
    setTargetWidth('');
    setTargetHeight('');
    setResult(null);
  };

  const cropRatio = Math.max(0.1, crop.width / crop.height);
  const cropPreviewStyle = {
    aspectRatio: `${Math.max(1, crop.width)} / ${Math.max(1, crop.height)}`,
    maxWidth: `min(100%, calc(70vh * ${cropRatio}))`,
  };

  const cropImageStyle = {
    width: `${(sourceSize.width / crop.width) * 100}%`,
    height: `${(sourceSize.height / crop.height) * 100}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-primary/20 bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12 max-w-5xl">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
          Back to Tools
        </Link>

        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <HugeiconsIcon icon={ImageCropIcon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Image Resize & Crop</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Crop from exact pixel bounds, resize output dimensions, and export a fresh local image.
          </p>
        </div>

        {!file ? (
          <FileUploadZone
            accept="image/*"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload one image to resize and crop"
          />
        ) : !result ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-4 border-border/60 bg-background/50 flex flex-col gap-4">
                <div
                  ref={cropFrameRef}
                  className="relative mx-auto w-full overflow-hidden rounded-xl border border-cyan-500/40 bg-muted/30 shadow-inner touch-none cursor-grab active:cursor-grabbing"
                  style={cropPreviewStyle}
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  onPointerCancel={handleCropPointerUp}
                >
                  <NextImage
                    src={sourceUrl}
                    alt="Live crop preview"
                    width={sourceSize.width || 1}
                    height={sourceSize.height || 1}
                    unoptimized
                    className="absolute max-w-none select-none object-fill"
                    style={cropImageStyle}
                    draggable={false}
                  />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/50" />
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <div key={index} className="border border-white/25" />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground font-dm-sans sm:flex-row sm:items-center sm:justify-between">
                  <span>Source: {sourceSize.width} x {sourceSize.height}px</span>
                  <span>Crop: {crop.width} x {crop.height}px at {crop.x}, {crop.y}</span>
                </div>
              </Card>
            </div>

            <Card className="p-6 border-border/60 bg-background/50 flex flex-col gap-5">
              <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">Settings</h3>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground/80 font-dm-sans">Crop preset</label>
                <Select value={preset} onValueChange={applyPreset}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Original">Original</SelectItem>
                    <SelectItem value="1:1">Square 1:1</SelectItem>
                    <SelectItem value="4:3">Classic 4:3</SelectItem>
                    <SelectItem value="16:9">Wide 16:9</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['x', 'y', 'width', 'height'] as const).map((field) => (
                  <label key={field} className="flex flex-col gap-1 text-[10px] uppercase font-bold text-muted-foreground font-dm-sans">
                    {field}
                    <input
                      type="number"
                      aria-label={`Crop ${field}`}
                      value={crop[field]}
                      onChange={(event) => updateCropField(field, event.target.value)}
                      className="px-3 py-2 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-semibold font-dm-sans">
                  <label htmlFor="crop-zoom">Image zoom</label>
                  <span className="text-primary">{cropZoom.toFixed(1)}x</span>
                </div>
                <input
                  id="crop-zoom"
                  type="range"
                  min={1}
                  max={4}
                  step={0.1}
                  value={cropZoom}
                  onChange={(event) => applyCropZoom(Number(event.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-[10px] text-muted-foreground font-dm-sans leading-relaxed">
                  Drag the preview to reposition the image inside the crop frame.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[10px] uppercase font-bold text-muted-foreground font-dm-sans">
                  Target width
                  <input type="number" aria-label="Target width" value={targetWidth} onChange={(e) => setTargetWidth(e.target.value)} className="px-3 py-2 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" />
                </label>
                <label className="flex flex-col gap-1 text-[10px] uppercase font-bold text-muted-foreground font-dm-sans">
                  Target height
                  <input type="number" aria-label="Target height" value={targetHeight} onChange={(e) => setTargetHeight(e.target.value)} className="px-3 py-2 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" />
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground/80 font-dm-sans">Output format</label>
                <Select value={targetFormat} onValueChange={setTargetFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/jpeg">JPG</SelectItem>
                    <SelectItem value="image/webp">WEBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleProcess} disabled={isProcessing} className="w-full font-semibold font-manrope">
                Resize & Crop
              </Button>
              <Button variant="ghost" onClick={reset} disabled={isProcessing} className="w-full text-xs font-semibold">
                Change File
              </Button>
            </Card>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
            <Card className="p-8 border-border/60 bg-background/50 flex flex-col items-center gap-6 text-center">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <HugeiconsIcon icon={Tick01Icon} className="size-7" />
              </div>
              <div>
                <h3 className="font-bold text-2xl font-manrope">Image Ready</h3>
                <p className="text-sm text-muted-foreground font-dm-sans mt-1">
                  Exported at {result.width} x {result.height}px.
                </p>
              </div>
              <div className="w-full rounded-xl border border-border/50 bg-muted/20 p-3">
                <NextImage
                  src={result.url}
                  alt="Processed preview"
                  width={result.width}
                  height={result.height}
                  unoptimized
                  className="mx-auto max-h-72 w-auto object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button variant="outline" onClick={reset} className="flex-1 text-xs font-semibold py-5">Start Over</Button>
                <Button asChild className="flex-1 text-xs font-semibold py-5">
                  <a href={result.url} download={result.name}>
                    <HugeiconsIcon icon={Download01Icon} className="size-4 mr-2" />
                    Download Image
                  </a>
                </Button>
              </div>
            </Card>
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
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
