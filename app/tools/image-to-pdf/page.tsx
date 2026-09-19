'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, Delete02Icon, Drag01Icon } from '@hugeicons/core-free-icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ACCENTS, requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';

const tool = requireTool('image-to-pdf');

/**
 * Mirrors the image formats the rest of the app accepts. WebP, TIFF and BMP are
 * normalised to PNG by the worker (MuPDF cannot embed WebP, and browsers cannot
 * render TIFF for the preview grid).
 */
const ACCEPTED_IMAGE_TYPES =
  'image/png,image/jpeg,image/webp,image/gif,image/tiff,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.tif,.tiff,.bmp';

const UPLOAD_DESCRIPTION = 'Upload images to compile (PNG, JPEG, WebP, GIF, TIFF, BMP)';

interface ImageFile {
  id: string;
  name: string;
  size: number;
  url: string;
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

interface PreparedImage {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  buffer: ArrayBuffer;
  previewBuffer: ArrayBuffer | null;
  previewMimeType: string | null;
  width: number;
  height: number;
}

interface PDFWorkerResult {
  buffer: ArrayBuffer;
}

// Sortable Image Item Component
interface SortableImageProps {
  id: string;
  item: ImageFile;
  onDelete: (id: string) => void;
}

function SortableImage({ id, item, onDelete }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex aspect-square flex-col overflow-hidden rounded-xl border bg-background shadow-sm ${
        isDragging
          ? 'border-primary ring-2 ring-primary/10 shadow-lg scale-105'
          : 'border-border/60'
      } transition-all duration-200 select-none`}
    >
      {/* Top bar with drag handle and delete */}
      <div className="h-7 border-b border-border/40 bg-muted/20 px-2 flex items-center justify-between">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground/80 p-0.5"
          aria-label="Drag to reorder"
        >
          <HugeiconsIcon icon={Drag01Icon} className="size-3.5" aria-hidden />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground font-dm-sans">
          {item.width} x {item.height}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 p-0.5 rounded transition-all"
          aria-label={`Remove ${item.name}`}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Thumbnail content */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 bg-muted/5">
        <NextImage
          src={item.url}
          alt={item.name}
          fill
          unoptimized
          sizes="(min-width: 640px) 12rem, 50vw"
          className="object-contain p-2 shadow-sm rounded pointer-events-none"
        />
      </div>

      {/* Footer Info */}
      <div className="h-6 px-2 bg-muted/10 flex items-center border-t border-border/20 justify-between truncate text-[9px] text-muted-foreground font-dm-sans">
        <span className="truncate max-w-[70%]" title={item.name}>
          {item.name}
        </span>
        <span className="shrink-0">{formatSize(item.size)}</span>
      </div>
    </div>
  );
}

export default function ImageToPDFPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [images, setImages] = useState<ImageFile[]>([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const imageUrlsRef = useRef<Set<string>>(new Set());
  const addImagesInputRef = useRef<HTMLInputElement | null>(null);

  const revokeImageUrl = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    imageUrlsRef.current.delete(url);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  useEffect(() => {
    const imageUrls = imageUrlsRef.current;
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
      imageUrls.clear();
    };
  }, []);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setPdfBlobUrl('');

    const stamp = Date.now();
    const outcome = await task.runTask(
      async (report) => {
        const payload = await Promise.all(
          selectedFiles.map(async (file, i) => ({
            id: `${stamp}-${i}`,
            name: file.name,
            size: file.size,
            buffer: await file.arrayBuffer(),
          }))
        );

        report(0, 'Reading image attributes…');

        // The worker normalises each image into a PDF-embeddable format and
        // reports its dimensions, so previews and page sizing work for every
        // accepted format (including TIFF, which browsers cannot decode).
        const response = await postTask<
          { images: typeof payload },
          { images: PreparedImage[] }
        >('PREPARE_IMAGES', { images: payload }, (pct, msg) => report(pct, msg));

        return response.images.map((item) => {
          // TIFF ships a MuPDF-rendered PNG for the thumbnail, since browsers
          // cannot display TIFF directly.
          const previewBuffer = item.previewBuffer ?? item.buffer;
          const previewMimeType = item.previewMimeType ?? item.mimeType;
          const url = URL.createObjectURL(
            new Blob([previewBuffer], { type: previewMimeType })
          );
          imageUrlsRef.current.add(url);

          // The preview bytes are deliberately dropped here: the object URL
          // already owns them, and keeping both would double each image's cost.
          return {
            id: item.id,
            name: item.name,
            size: item.size,
            buffer: item.buffer,
            width: item.width,
            height: item.height,
            url,
          };
        });
      },
      {
        initialMessage: 'Reading image attributes…',
        errorMessage: 'Failed to load selected images.',
      }
    );

    if (outcome.ok) {
      setImages((prev) => [...prev, ...outcome.value]);
    }
  };

  const handleDeleteImage = (imgId: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === imgId);
      if (target?.url) {
        revokeImageUrl(target.url);
      }
      return prev.filter((item) => item.id !== imgId);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleCompile = async () => {
    if (images.length === 0) return;

    const outcome = await task.runTask(
      async (report) => {
        // Prepare worker payload: transfers copy of ArrayBuffers
        const imagesPayload = images.map((img) => ({
          buffer: img.buffer.slice(0),
          name: img.name,
          width: img.width,
          height: img.height,
        }));

        report(0, 'Compiling images into PDF pages…');

        const response = await postTask<{ images: typeof imagesPayload }, PDFWorkerResult>(
          'IMAGE_TO_PDF',
          { images: imagesPayload },
          (pct, msg) => report(pct, msg)
        );

        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      },
      {
        initialMessage: 'Collocating image list…',
        errorMessage: 'Failed to compile PDF.',
      }
    );

    if (outcome.ok) {
      setPdfBlobUrl(outcome.value);
    }
  };

  const clearWorkspace = () => {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current.clear();
    setImages([]);
    setPdfBlobUrl('');
    task.reset();
  };

  return (
    <ToolPageShell
      title={tool.title}
      description={tool.description}
      icon={tool.icon}
      accent={tool.accent}
      width="wide"
    >
      <div className="flex flex-col gap-6">
        <TaskErrorBanner message={task.error} onDismiss={task.clearError} />

        {images.length === 0 ? (
          <FileUploadZone
            accept={ACCEPTED_IMAGE_TYPES}
            multiple={true}
            onFilesSelected={handleFilesSelected}
            description={UPLOAD_DESCRIPTION}
          />
        ) : !pdfBlobUrl ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Collation Workspace */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold font-manrope">
                  <span
                    className={`flex h-2 w-2 rounded-full ${ACCENTS[tool.accent].bar}`}
                    aria-hidden
                  />
                  Images collation
                </h2>
                <span className="text-xs text-muted-foreground font-dm-sans">
                  {images.length} Image{images.length > 1 ? 's' : ''} • Drag to reorder
                </span>
              </div>

              {/* Light Table Collation Grid */}
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/5 min-h-[400px] p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {images.map((item) => (
                        <SortableImage
                          key={item.id}
                          id={item.id}
                          item={item}
                          onDelete={handleDeleteImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 flex flex-col gap-6 border-border/60 bg-background/50 p-6 backdrop-blur-sm">
                <h2 className="border-b border-border/40 pb-3 text-sm font-bold font-manrope">
                  Document Settings
                </h2>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Settings:
                  </span>
                  <div className="text-[10px] text-muted-foreground leading-relaxed font-dm-sans border border-border/40 p-3 rounded-lg bg-muted/20 flex flex-col gap-1">
                    <span>
                      Layout: <strong>Fit Image Size</strong>
                    </span>
                    <span>Generates custom page dimensions matching the uploaded images.</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Add more images:
                  </span>
                  {/* A real <button> rather than a styled <label>, so the control
                      is focusable and operable from the keyboard. */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => addImagesInputRef.current?.click()}
                  >
                    Upload Images
                  </Button>
                  <input
                    ref={addImagesInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fileList = Array.from(e.target.files || []);
                      e.target.value = '';
                      handleFilesSelected(fileList);
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                  <Button
                    onClick={handleCompile}
                    disabled={images.length === 0 || task.isProcessing}
                    className={`w-full font-semibold font-manrope ${ACCENTS[tool.accent].button}`}
                  >
                    Compile PDF
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearWorkspace}
                    disabled={task.isProcessing}
                    className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Reset Workspace
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Output Success State */
          <SuccessCard
            title="PDF Compiled"
            description={`Compiled ${images.length} image${images.length > 1 ? 's' : ''} into a single organized PDF document locally.`}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={clearWorkspace}
                  className="flex-1 py-5 text-xs font-semibold"
                >
                  Start Over
                </Button>
                <Button
                  asChild
                  className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.accent].button}`}
                >
                  <a href={pdfBlobUrl} download="images_document.pdf">
                    <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                    Download PDF
                  </a>
                </Button>
              </>
            }
          />
        )}
      </div>

      {task.isProcessing && (
        <ProcessingOverlay
          accent={tool.accent}
          message={task.message}
          progress={task.progress}
        />
      )}
    </ToolPageShell>
  );
}
