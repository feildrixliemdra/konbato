'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useWorker } from '@/lib/hooks/useWorker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Image01Icon,
  Download01Icon,
  ArrowLeft01Icon,
  Tick01Icon,
  Delete02Icon,
  Drag01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
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

interface ImageFile {
  id: string;
  name: string;
  size: number;
  url: string;
  buffer: ArrayBuffer;
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square bg-background border rounded-xl overflow-hidden shadow-sm flex flex-col ${
        isDragging
          ? 'border-primary ring-2 ring-primary/10 shadow-lg scale-105'
          : 'border-border/60 hover:border-border-hover'
      } transition-all duration-200 select-none`}
    >
      {/* Top bar with drag handle and delete */}
      <div className="h-7 border-b border-border/40 bg-muted/20 px-2 flex items-center justify-between">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground/80 p-0.5"
          title="Drag to reorder"
        >
          <HugeiconsIcon icon={Drag01Icon} className="size-3.5" />
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
          title="Remove image"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
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
        <span className="shrink-0">
          {formatSize(item.size)}
        </span>
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

  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const imageUrlsRef = useRef<Set<string>>(new Set());

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

    setIsProcessing(true);
    setProgress(20);
    setProgressMessage('Reading image attributes...');

    try {
      const newImagesList: ImageFile[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const buffer = await file.arrayBuffer();
        const url = URL.createObjectURL(file);
        imageUrlsRef.current.add(url);
        
        // Retrieve image dimensions using HTML Image decoders
        const imgDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          const imgEl = new Image();
          imgEl.onload = () => resolve({ width: imgEl.naturalWidth, height: imgEl.naturalHeight });
          imgEl.onerror = () => reject(new Error('Failed to load image element'));
          imgEl.src = url;
        });

        newImagesList.push({
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          url,
          buffer,
          width: imgDimensions.width,
          height: imgDimensions.height,
        });
      }

      setImages((prev) => [...prev, ...newImagesList]);
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to load selected images.');
    } finally {
      setIsProcessing(false);
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
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Collocating image list...');

    try {
      // Prepare worker payload: transfers copy of ArrayBuffers
      const imagesPayload = images.map((img) => ({
        buffer: img.buffer.slice(0),
        name: img.name,
        width: img.width,
        height: img.height,
      }));

      setProgressMessage('Compiling images into PDF pages...');
      const response = await postTask<{ images: typeof imagesPayload }, PDFWorkerResult>('IMAGE_TO_PDF', { images: imagesPayload }, (pct, msg) => {
        setProgress(pct);
        if (msg) setProgressMessage(msg);
      });

      const blob = new Blob([response.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setProgress(100);
      setProgressMessage('PDF created successfully!');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to compile PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearWorkspace = () => {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current.clear();
    setImages([]);
    setPdfBlobUrl('');
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-primary/20 bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12 max-w-6xl">
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
              <HugeiconsIcon icon={Image01Icon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Image to PDF</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Compile images (JPEG/PNG) client-side into a single PDF document. Drag pages to arrange collation order.
          </p>
        </div>

        {images.length === 0 ? (
          <FileUploadZone
            accept="image/png, image/jpeg"
            multiple={true}
            onFilesSelected={handleFilesSelected}
            description="Upload images to compile (JPEG, PNG)"
          />
        ) : !pdfBlobUrl ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Collation Workspace */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-primary" />
                  Images collation
                </h3>
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
              <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-6 sticky top-6">
                <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                  Document Settings
                </h3>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Settings:
                  </span>
                  <div className="text-[10px] text-muted-foreground leading-relaxed font-dm-sans border border-border/40 p-3 rounded-lg bg-muted/20 flex flex-col gap-1">
                    <span>Layout: <strong>Fit Image Size</strong></span>
                    <span>Generates custom page dimensions matching the uploaded images.</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Add more images:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full relative cursor-pointer"
                    asChild
                  >
                    <label>
                      Upload Images
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const fileList = Array.from(e.target.files || []);
                          handleFilesSelected(fileList);
                        }}
                      />
                    </label>
                  </Button>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                  <Button
                    onClick={handleCompile}
                    disabled={images.length === 0 || isProcessing}
                    className="w-full font-semibold font-manrope"
                  >
                    Compile PDF
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearWorkspace}
                    disabled={isProcessing}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto flex flex-col gap-6"
          >
            <div className="border border-border/60 bg-background/50 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center gap-6 text-center shadow-xl">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <HugeiconsIcon icon={Tick01Icon} className="size-7" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-2xl font-manrope">PDF Compiled</h3>
                <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed">
                  Compiled {images.length} image{images.length > 1 ? 's' : ''} into a single organized PDF document locally.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={clearWorkspace}
                  className="flex-1 font-semibold text-xs py-5"
                >
                  Start Over
                </Button>
                <Button
                  asChild
                  className="flex-1 font-semibold text-xs py-5 shadow-lg shadow-primary/10"
                >
                  <a href={pdfBlobUrl} download="images_document.pdf">
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
