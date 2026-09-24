'use client';

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { LabeledSlider } from '@/components/tools/labeled-slider';
import { FieldInput } from '@/components/tools/field-input';
import { PanelActions, PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { NotePanel } from '@/components/tools/note-panel';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { renderPdfPageToDataUrl } from '@/lib/pdf-utils';
import { drawWatermark, type WatermarkPosition, type WatermarkSpec } from '@/lib/watermark-draw';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, Upload02Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import { cn } from '@/lib/utils';

const tool = requireTool('pdf-watermark');

/** pdf.js renders the preview at scale 0.5, so 1 point = 0.5 canvas px. */
const PREVIEW_SCALE = 0.5;

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'middle-left', label: 'Middle left' },
  { value: 'center', label: 'Center' },
  { value: 'middle-right', label: 'Middle right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
];

interface PDFFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

interface LogoImage {
  buffer: ArrayBuffer;
  bitmap: ImageBitmap;
}

interface PdfWorkerBufferResult {
  buffer: ArrayBuffer;
}

export default function PDFWatermarkPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
      type: 'module',
    });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PDFFile | null>(null);
  const [kind, setKind] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [color, setColor] = useState('#ff0000');
  const [fontSizePt, setFontSizePt] = useState(60);
  const [sizePct, setSizePct] = useState(20);
  const [opacity, setOpacity] = useState(20);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<WatermarkPosition>('tiled');
  const [logo, setLogo] = useState<LogoImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const buildSpec = useCallback((): WatermarkSpec => {
    return {
      kind,
      text,
      fontSizePt,
      color,
      image: kind === 'image' ? logo?.bitmap ?? null : null,
      sizePct,
      opacity,
      rotation,
      position,
    };
  }, [kind, text, fontSizePt, color, logo, sizePct, opacity, rotation, position]);

  // Redraw the preview whenever any input changes. Shared with the worker, so
  // what the user sees is what they get.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      drawWatermark(ctx, buildSpec(), canvas.width, canvas.height, PREVIEW_SCALE);
    };
    img.src = previewUrl;
    return () => {
      cancelled = true;
    };
  }, [previewUrl, buildSpec]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setBlobUrl('');
    task.clearError();

    const targetFile = selectedFiles[0];
    const loaded = await task.runTask(
      async () => {
        const buffer = await targetFile.arrayBuffer();
        // Page 1 as the preview base; the watermark is uniform across pages.
        const preview = await renderPdfPageToDataUrl(buffer, 1, PREVIEW_SCALE);
        return { name: targetFile.name, size: targetFile.size, buffer, preview };
      },
      {
        initialMessage: 'Reading document…',
        errorMessage: 'Could not read this PDF file.',
      }
    );

    if (loaded.ok) {
      setFile({ name: loaded.value.name, size: loaded.value.size, buffer: loaded.value.buffer });
      setPreviewUrl(loaded.value.preview);
    }
  };

  const handleLogoSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const buffer = await f.arrayBuffer();
    const bitmap = await createImageBitmap(new Blob([buffer]));
    logo?.bitmap.close();
    setLogo({ buffer, bitmap });
  };

  const handleWatermark = async () => {
    if (!file) return;

    const outcome = await task.runTask(
      async () => {
        const payload = {
          buffer: file.buffer.slice(0),
          spec: {
            kind,
            text,
            fontSizePt,
            color,
            imageBuffer: kind === 'image' ? logo?.buffer : undefined,
            sizePct,
            opacity,
            rotation,
            position,
          },
        };
        const response = await postTask<typeof payload, PdfWorkerBufferResult>(
          'WATERMARK_PDF',
          payload
        );
        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      },
      {
        initialMessage: 'Applying watermark…',
        errorMessage: 'Could not watermark this PDF.',
      }
    );

    if (outcome.ok) setBlobUrl(outcome.value);
  };

  const clearWorkspace = () => {
    logo?.bitmap.close();
    setFile(null);
    setLogo(null);
    setPreviewUrl('');
    setBlobUrl('');
    task.reset();
  };

  const canApply = kind === 'text' ? text.trim().length > 0 : logo !== null;

  const kindButton = (value: 'text' | 'image', label: string) => (
    <button
      type="button"
      onClick={() => setKind(value)}
      aria-pressed={kind === value}
      className={cn(
        'flex-1 rounded-lg py-2.5 text-xs font-semibold transition-[color,background-color,box-shadow] [@media(pointer:coarse)]:min-h-11',
        kind === value
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );

  return (
    <ToolPageShell
      title={tool.title}
      description={tool.description}
      icon={tool.icon}
      category={tool.category}
    >
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to watermark"
          />
        </div>
      ) : !blobUrl ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Preview */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-sm font-bold font-manrope">Preview</h2>
              <span className="text-xs text-muted-foreground font-dm-sans">Page 1</span>
            </div>
            <div className="flex justify-center rounded-2xl border border-border/60 bg-muted/5 p-4">
              <canvas ref={canvasRef} className="max-h-[60vh] max-w-full rounded-lg shadow-sm" />
            </div>

            <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
              <h2 className="text-sm font-bold font-manrope">Watermark</h2>
              <div
                role="group"
                aria-label="Watermark type"
                className="flex gap-1.5 rounded-xl border border-border/40 bg-muted/40 p-1"
              >
                {kindButton('text', 'Text')}
                {kindButton('image', 'Image')}
              </div>
            </div>

            {kind === 'text' ? (
              <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
                <FieldInput
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="CONFIDENTIAL"
                  aria-label="Watermark text"
                />
                <div className="flex flex-col gap-2">
                  <label htmlFor="watermark-color" className="text-xs font-semibold font-dm-sans">
                    Color:
                  </label>
                  <input
                    id="watermark-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background p-1"
                  />
                </div>
                <LabeledSlider
                  id="watermark-font-size"
                  label="Font size:"
                  value={fontSizePt}
                  min={24}
                  max={200}
                  step={2}
                  unit=" pt"
                  onChange={setFontSizePt}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/5 py-6 text-xs font-semibold text-muted-foreground [@media(pointer:coarse)]:min-h-11">
                  <HugeiconsIcon icon={Upload02Icon} className="size-5" aria-hidden />
                  {logo ? 'Change logo' : 'Upload logo image'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleLogoSelected}
                  />
                </label>
                <LabeledSlider
                  id="watermark-size"
                  label="Size (of page width):"
                  value={sizePct}
                  min={5}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={setSizePct}
                  disabled={!logo}
                />
              </div>
            )}

            <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
              <h2 className="text-sm font-bold font-manrope">Position</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('tiled')}
                  aria-pressed={position === 'tiled'}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors [@media(pointer:coarse)]:min-h-11',
                    position === 'tiled'
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  Tiled
                </button>
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPosition(p.value)}
                    aria-pressed={position === p.value}
                    aria-label={p.label}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors [@media(pointer:coarse)]:min-h-11',
                      position === p.value
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <LabeledSlider
              id="watermark-opacity"
              label="Opacity:"
              value={opacity}
              min={5}
              max={100}
              step={5}
              unit="%"
              onChange={setOpacity}
            />

            <LabeledSlider
              id="watermark-rotation"
              label="Rotation:"
              value={rotation}
              min={-90}
              max={90}
              step={5}
              unit="°"
              onChange={setRotation}
            />

            <NotePanel className="flex flex-col gap-2">
              <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                Watermarks are flattened into each page, so they cannot be removed
                downstream. Because pages are re-encoded as images, text in the output
                is no longer selectable.
              </p>
            </NotePanel>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <ToolPanel title="Document details" sticky>
              <div className="flex flex-col gap-2.5 text-xs text-muted-foreground font-dm-sans">
                <span>
                  Name:{' '}
                  <strong className="block truncate text-foreground">{file.name}</strong>
                </span>
                <span>
                  Type: <strong>{kind === 'text' ? 'Text' : 'Image'}</strong>
                </span>
              </div>

              <PanelActions>
                <PanelPrimaryAction
                  category={tool.category}
                  onClick={handleWatermark}
                  disabled={task.isProcessing || !canApply}
                >
                  Apply Watermark
                </PanelPrimaryAction>
                <PanelSecondaryAction onClick={clearWorkspace} disabled={task.isProcessing}>
                  Change File
                </PanelSecondaryAction>
              </PanelActions>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Watermark Applied"
          description={`Watermark applied to ${file.name}. Processed locally — nothing was uploaded.`}
          actions={
            <>
              <Button
                variant="outline"
                onClick={clearWorkspace}
                className="flex-1 py-5 text-xs font-semibold"
              >
                Watermark New File
              </Button>
              <Button
                asChild
                className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.category].button}`}
              >
                <a href={blobUrl} download={`watermarked_${file.name}`}>
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                  Download PDF
                </a>
              </Button>
            </>
          }
        />
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
