'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { LabeledSlider } from '@/components/tools/labeled-slider';
import { PanelActions, PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { FieldInput } from '@/components/tools/field-input';
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
import { Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';

const tool = requireTool('image-resize-crop');

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

const cropFields = ['x', 'y', 'width', 'height'] as const;

export default function ImageResizeCropPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/image.worker.ts', import.meta.url));
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

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
  const [result, setResult] = useState<{
    url: string;
    name: string;
    width: number;
    height: number;
  } | null>(null);

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

    const url = URL.createObjectURL(selected);
    setFile(selected);
    setSourceUrl(url);
    setResult(null);
    setPreset('Original');
    task.clearError();

    const image = new window.Image();
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

    const ratios: Record<string, number> = { '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9 };

    const nextCrop =
      value === 'Original'
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

  const nudgeCrop = (deltaX: number, deltaY: number) => {
    setPreset('Custom');
    setCrop((current) =>
      clampCrop(
        { ...current, x: current.x + deltaX, y: current.y + deltaY },
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
    if (!sourceSize.width || !sourceSize.height || result || task.isProcessing) return;

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

    setPreset('Custom');
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

  // Keyboard equivalent of dragging the preview.
  const handleCropKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nudgeCrop(step, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        nudgeCrop(-step, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        nudgeCrop(0, step);
        break;
      case 'ArrowDown':
        event.preventDefault();
        nudgeCrop(0, -step);
        break;
      default:
        break;
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    const outcome = await task.runTask(
      async () => {
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
        >('RESIZE_CROP', {
          buffer: await file.arrayBuffer(),
          fileName: file.name,
          mimeType: file.type,
          targetMimeType: targetFormat,
          crop,
          targetWidth: Number(targetWidth) || crop.width,
          targetHeight: Number(targetHeight) || crop.height,
          quality: 90,
        });

        const blob = new Blob([response.buffer], { type: response.mimeType });
        return {
          url: URL.createObjectURL(blob),
          name: outputName,
          width: response.width,
          height: response.height,
        };
      },
      {
        initialMessage: 'Applying resize and crop…',
        errorMessage: 'Resize and crop failed.',
      }
    );

    if (outcome.ok) setResult(outcome.value);
  };

  const reset = () => {
    setFile(null);
    setSourceSize({ width: 0, height: 0 });
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setCropZoom(1);
    setTargetWidth('');
    setTargetHeight('');
    setResult(null);
    task.reset();
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
    <ToolPageShell
      title={tool.title}
      description="Crop from exact pixel bounds, resize output dimensions, and export a fresh local image."
      icon={tool.icon}
      category={tool.category}
    >
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone
            accept="image/*"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload one image to resize and crop"
          />
        </div>
      ) : !result ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="flex flex-col gap-4 p-4">
              <div
                ref={cropFrameRef}
                role="group"
                tabIndex={0}
                aria-label="Crop preview. Use the arrow keys to reposition the crop, hold Shift for larger steps."
                className="relative mx-auto w-full cursor-grab touch-none overflow-hidden rounded-xl border border-category-image/40 bg-muted/30 shadow-inner focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
                style={cropPreviewStyle}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
                onKeyDown={handleCropKeyDown}
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
                <span>
                  Source: {sourceSize.width} × {sourceSize.height}px
                </span>
                <span>
                  Crop: {crop.width} × {crop.height}px at {crop.x}, {crop.y}
                </span>
              </div>
            </Card>
          </div>

          <ToolPanel title="Settings">

            <div className="flex flex-col gap-2">
              <label
                htmlFor="crop-preset"
                className="text-xs font-semibold font-dm-sans text-foreground/80"
              >
                Crop preset
              </label>
              <Select value={preset} onValueChange={applyPreset}>
                <SelectTrigger id="crop-preset">
                  <SelectValue />
                </SelectTrigger>
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
              {cropFields.map((field) => (
                <label
                  key={field}
                  className="flex flex-col gap-1 text-xs font-bold uppercase text-muted-foreground font-dm-sans"
                >
                  {field}
                  <FieldInput
                    type="number"
                    value={crop[field]}
                    onChange={(event) => updateCropField(field, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <LabeledSlider
              id="crop-zoom"
              label="Image zoom"
              value={cropZoom}
              min={1}
              max={4}
              step={0.1}
              unit="x"
              onChange={applyCropZoom}
              hint="Drag the preview, or focus it and use the arrow keys, to reposition the image inside the crop frame."
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted-foreground font-dm-sans">
                Target width
                <FieldInput
                  type="number"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted-foreground font-dm-sans">
                Target height
                <FieldInput
                  type="number"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(e.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="crop-output-format"
                className="text-xs font-semibold font-dm-sans text-foreground/80"
              >
                Output format
              </label>
              <Select value={targetFormat} onValueChange={setTargetFormat}>
                <SelectTrigger id="crop-output-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/png">PNG</SelectItem>
                  <SelectItem value="image/jpeg">JPG</SelectItem>
                  <SelectItem value="image/webp">WEBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <PanelActions>
              <PanelPrimaryAction
                category={tool.category}
                onClick={handleProcess}
                disabled={task.isProcessing}
              >
                Resize &amp; Crop
              </PanelPrimaryAction>
              <PanelSecondaryAction onClick={reset} disabled={task.isProcessing}>
                Change File
              </PanelSecondaryAction>
            </PanelActions>
          </ToolPanel>
        </div>
      ) : (
        <SuccessCard
          title="Image Ready"
          description={`Exported at ${result.width} × ${result.height}px.`}
          actions={
            <>
              <Button
                variant="outline"
                onClick={reset}
                className="flex-1 py-5 text-xs font-semibold"
              >
                Start Over
              </Button>
              <Button
                asChild
                className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.category].button}`}
              >
                <a href={result.url} download={result.name}>
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                  Download Image
                </a>
              </Button>
            </>
          }
        >
          <div className="w-full rounded-xl border border-border/50 bg-muted/20 p-3">
            <NextImage
              src={result.url}
              alt="Processed image preview"
              width={result.width}
              height={result.height}
              unoptimized
              className="mx-auto max-h-72 w-auto rounded-lg object-contain"
            />
          </div>
        </SuccessCard>
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
