'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { ResultActionBar } from '@/components/tools/result-action-bar';
import { LabeledSlider } from '@/components/tools/labeled-slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { ColorsIcon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { ACCENTS, accentTile, requireTool } from '@/lib/tools';
import { triggerDownload } from '@/lib/format';
import {
  getModelCacheServerSnapshot,
  getModelCacheSnapshot,
  markModelCacheDownloaded,
  subscribeModelCache,
} from '@/lib/bg-model-cache';

const tool = requireTool('image-remove-bg');

export default function ImageRemoveBgPage() {
  // Background removal runs on the main thread via @imgly/background-removal,
  // so there is no worker to hand to useToolTask here.
  const task = useToolTask();

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [cutoutUrl, setCutoutUrl] = useState<string>('');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // Read from the store instead of localStorage-in-an-effect, so the first
  // client render already knows the answer.
  const isModelDownloaded = useSyncExternalStore(
    subscribeModelCache,
    getModelCacheSnapshot,
    getModelCacheServerSnapshot
  );

  // Release each object URL when it is replaced and when the page unmounts.
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  useEffect(() => {
    return () => {
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
    };
  }, [cutoutUrl]);

  const handleFilesSelected = (files: File[]) => {
    const nextFile = files.length > 0 ? files[0] : null;

    // Created here rather than in an effect that watches `file`: selecting a
    // file is the event that produces the preview URL. The effect above
    // releases the previous URL when this state changes.
    setOriginalUrl(nextFile ? URL.createObjectURL(nextFile) : '');
    setFile(nextFile);
    setCutoutUrl('');
    task.clearError();
  };

  const handleRemoveBackgroundClick = () => {
    if (isModelDownloaded) {
      void startProcessing();
    } else {
      setShowConfirmDialog(true);
    }
  };

  const startProcessing = async () => {
    if (!file) return;
    const cached = isModelDownloaded;

    const url = await task.runTask(
      async (report) => {
        report(cached ? 15 : 0, cached
          ? 'Loading model weights from local cache…'
          : 'Initializing neural network engine…');

        // Lazy load the library on user action to keep the initial bundle light
        const { removeBackground } = await import('@imgly/background-removal');

        const outBlob = await removeBackground(file, {
          progress: (key: string, current: number, total: number) => {
            if (total <= 0) return;
            const percent = Math.round((current / total) * 100);
            if (key.includes('fetch')) {
              report(
                Math.round(percent * 0.4),
                `Downloading model weights: ${percent}%`
              );
            } else if (key.includes('compute') || key.includes('processing')) {
              report(
                Math.round(40 + percent * 0.6),
                'Isolating foreground subject…'
              );
            }
          },
        });

        markModelCacheDownloaded();
        return URL.createObjectURL(outBlob);
      },
      {
        errorMessage:
          'Background removal failed. Your device may lack the required WebGL or WASM support.',
      }
    );

    if (url.ok) setCutoutUrl(url.value);
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    const container = document.getElementById('comparison-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const startOver = () => {
    // Clearing the URLs lets the effects above release the blobs.
    setFile(null);
    setOriginalUrl('');
    setCutoutUrl('');
    task.reset();
  };

  return (
    <ToolPageShell
      title={tool.title}
      description="Isolate subjects from photos 100% locally in your browser. Runs a local AI segmentation model with zero server uploads."
      icon={tool.icon}
      accent={tool.accent}
    >
      {!cutoutUrl ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />

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
                disabled={task.isProcessing}
                className={`w-full px-8 font-semibold font-manrope sm:w-auto ${ACCENTS[tool.accent].button}`}
              >
                Remove Background
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          <ResultActionBar
            title="Background Removed"
            subtitle="Drag the handle — or use the slider — to compare the original and the cutout."
            onStartOver={startOver}
            onDownloadAll={() =>
              triggerDownload(cutoutUrl, `cutout_${file?.name ?? 'image.png'}`)
            }
            downloadLabel="Download PNG"
            startOverLabel="Start Over"
          />

          {/* Slider Comparison Component */}
          <div
            id="comparison-container"
            className="relative aspect-square w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-border/80 bg-muted/40 md:aspect-[4/3]"
            style={{ touchAction: 'none' }}
            onMouseMove={(e) => isDraggingSlider && handleSliderMove(e)}
            onTouchMove={(e) => isDraggingSlider && handleSliderMove(e)}
            onMouseDown={() => setIsDraggingSlider(true)}
            onTouchStart={() => setIsDraggingSlider(true)}
            onMouseUp={() => setIsDraggingSlider(false)}
            onMouseLeave={() => setIsDraggingSlider(false)}
            onTouchEnd={() => setIsDraggingSlider(false)}
          >
            {/* Underneath: transparent cutout */}
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-muted/5 [background-size:16px_16px]">
              <Image
                src={cutoutUrl}
                alt="Cutout with the background removed"
                fill
                unoptimized
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="pointer-events-none object-contain"
              />
            </div>

            {/* Overlaid: original image, clipped to the handle */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-background/5"
              style={{
                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              }}
            >
              <Image
                src={originalUrl}
                alt="Original image"
                fill
                unoptimized
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="pointer-events-none object-contain"
              />
            </div>

            {/* Separator */}
            <div
              className="absolute bottom-0 top-0 flex w-0.5 cursor-ew-resize items-center justify-center bg-indigo-500"
              style={{ left: `${sliderPosition}%` }}
              aria-hidden
            >
              <div className="flex size-7 select-none items-center justify-center rounded-full border border-white/20 bg-indigo-500 text-white shadow-lg">
                <span className="text-[10px] font-bold">↔</span>
              </div>
            </div>
          </div>

          {/* Keyboard-accessible equivalent of the drag handle */}
          <div className="mx-auto w-full max-w-md">
            <LabeledSlider
              id="compare-split"
              label="Comparison split"
              value={sliderPosition}
              min={0}
              max={100}
              unit="%"
              onChange={setSliderPosition}
              hint="Left shows the original, right shows the cutout."
            />
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className={accentTile(tool.accent)}>
              <HugeiconsIcon icon={ColorsIcon} aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle className="font-manrope font-bold">
              One-Time Download Required
            </AlertDialogTitle>
            <AlertDialogDescription className="font-dm-sans">
              This tool isolates subjects using a neural network running{' '}
              <strong>entirely inside your browser</strong>. To start, your browser needs
              to download the model weights file (<strong>~25 MB</strong>).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 bg-muted/40 p-3 text-xs text-muted-foreground font-dm-sans">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              <span>100% secure: files are never uploaded to servers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              <span>Offline-ready: once cached, runs without internet</span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void startProcessing()}
              className={`text-xs font-semibold ${ACCENTS[tool.accent].button}`}
            >
              Download &amp; Process
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ToolPageShell>
  );
}
