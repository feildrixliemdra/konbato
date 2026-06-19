'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useWorker } from '@/lib/hooks/useWorker';
import { getPdfPageCount, renderPdfPageToDataUrl } from '@/lib/pdf-utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Layers01Icon,
  Download01Icon,
  ArrowLeft01Icon,
  Tick01Icon,
  Delete02Icon,
  RotateRightIcon,
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

interface PDFFile {
  id: string;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount: number;
}

interface PDFPageItem {
  id: string; // unique page ID, e.g. "fileId-pageNum"
  fileId: string;
  fileName: string;
  pageIndex: number; // 0-based
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270 degrees
}

interface PDFWorkerResult {
  buffer: ArrayBuffer;
}

function createDownloadId() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const timePart = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const randomPart = Math.random().toString(36).slice(2, 6);

  return `${datePart}-${timePart}-${randomPart}`;
}

// Sortable Item Component
interface SortablePageProps {
  id: string;
  item: PDFPageItem;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortablePage({ id, item, onRotate, onDelete }: SortablePageProps) {
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
      className={`group relative aspect-[3/4] bg-background border rounded-xl overflow-hidden shadow-sm flex flex-col ${
        isDragging
          ? 'border-red-500 ring-2 ring-red-500/10 shadow-lg scale-105'
          : 'border-border/60 hover:border-border-hover'
      } transition-all duration-200 select-none`}
    >
      {/* Top Bar with drag handle and delete */}
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
          p. {item.pageIndex + 1}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 p-0.5 rounded transition-all"
          title="Remove page"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
        </button>
      </div>

      {/* Page Content / Thumbnail */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center p-2.5 bg-muted/5">
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${item.rotation}deg)` }}
        >
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnailUrl}
              alt={`Page ${item.pageIndex + 1} of ${item.fileName}`}
              className="max-w-full max-h-full object-contain shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded pointer-events-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border/60 bg-muted/20 text-[10px] text-muted-foreground font-dm-sans">
              Preview unavailable
            </div>
          )}
        </div>

        {/* Rotate button overlay */}
        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[1px]">
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(id);
            }}
            className="size-8 rounded-lg shadow-sm border border-border/40"
            title="Rotate 90° clockwise"
          >
            <HugeiconsIcon icon={RotateRightIcon} className="size-4" />
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="h-6 px-2 bg-muted/10 flex items-center border-t border-border/20 truncate">
        <span className="text-[9px] text-muted-foreground truncate font-dm-sans w-full" title={item.fileName}>
          {item.fileName}
        </span>
      </div>
    </div>
  );
}

export default function PDFMergePage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);

  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string>('');
  const [mergedFileName, setMergedFileName] = useState<string>('collated_document.pdf');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag starts after moving 8px, allowing clicks on buttons
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    return () => {
      if (mergedBlobUrl) {
        URL.revokeObjectURL(mergedBlobUrl);
      }
    };
  }, [mergedBlobUrl]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setMergedBlobUrl('');
    setMergedFileName('collated_document.pdf');

    setIsProcessing(true);
    setProgress(10);
    setProgressMessage('Reading document structures...');

    try {
      const newFiles: PDFFile[] = [];
      const newPagesList: PDFPageItem[] = [];

      for (let fIdx = 0; fIdx < selectedFiles.length; fIdx++) {
        const file = selectedFiles[fIdx];
        const buffer = await file.arrayBuffer();
        const pageCount = await getPdfPageCount(buffer);
        const fileId = `${Date.now()}-${fIdx}`;

        newFiles.push({
          id: fileId,
          name: file.name,
          size: file.size,
          buffer,
          pageCount,
        });

        // Limit initial thumbnail generation to first 30 pages to prevent browser lockup
        const renderPagesCount = Math.min(pageCount, 30);
        for (let p = 0; p < renderPagesCount; p++) {
          setProgressMessage(`Rendering thumbnail for ${file.name} (page ${p + 1}/${renderPagesCount})...`);
          const thumbnail = await renderPdfPageToDataUrl(buffer, p + 1);
          newPagesList.push({
            id: `${fileId}-${p}`,
            fileId,
            fileName: file.name,
            pageIndex: p,
            thumbnailUrl: thumbnail,
            rotation: 0,
          });
        }

        // Add placeholders if page count exceeds 30
        for (let p = renderPagesCount; p < pageCount; p++) {
          newPagesList.push({
            id: `${fileId}-${p}`,
            fileId,
            fileName: file.name,
            pageIndex: p,
            thumbnailUrl: '', // Will use a placeholder on the card
            rotation: 0,
          });
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
      setPages((prev) => [...prev, ...newPagesList]);
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to parse uploaded PDF documents.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDeletePage = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPages((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleMerge = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Preparing collation pipeline...');

    try {
      // Find all unique files actually used in the current pages collation sequence
      const activeFileIds = Array.from(new Set(pages.map((p) => p.fileId)));
      const activeFiles = files.filter((f) => activeFileIds.includes(f.id));

      // Map pages sequence to relative indexes
      const pagesPayload = pages.map((p) => {
        const fileIdx = activeFiles.findIndex((f) => f.id === p.fileId);
        return {
          fileIndex: fileIdx,
          pageIndex: p.pageIndex,
          rotation: p.rotation,
        };
      });

      // Prepare file buffers
      const filesPayload = activeFiles.map((f) => ({
        name: f.name,
        buffer: f.buffer.slice(0), // Transferable buffer copy
      }));

      setProgressMessage('Merging and rotating pages in Web Worker...');
      const result = await postTask<
        { files: { name: string; buffer: ArrayBuffer }[]; pages: { fileIndex: number; pageIndex: number; rotation: number }[] },
        PDFWorkerResult
      >(
        'MERGE_SPLIT_ROTATE',
        { files: filesPayload, pages: pagesPayload },
        (pct, msg) => {
          setProgress(pct);
          if (msg) setProgressMessage(msg);
        }
      );

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedBlobUrl(url);
      setMergedFileName(`collated_document_${createDownloadId()}.pdf`);
      setProgress(100);
      setProgressMessage('Merge completed!');
    } catch (err) {
      console.error(err);
      setProgressMessage('PDF merging failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearWorkspace = () => {
    setFiles([]);
    setPages([]);
    setMergedBlobUrl('');
    setMergedFileName('collated_document.pdf');
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-red-500/20 bg-background">
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
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <HugeiconsIcon icon={Layers01Icon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">Merge PDF</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-xl">
            Arrange, rotate, and combine multiple PDF pages into a single organized document. All actions occur entirely in browser memory.
          </p>
        </div>

        {pages.length === 0 ? (
          <FileUploadZone
            accept="application/pdf"
            multiple={true}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF documents to collate (multiple allowed)"
          />
        ) : !mergedBlobUrl ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Light Table Collation Workspace (Grid) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  Light Table Collation
                </h3>
                <span className="text-xs text-muted-foreground font-dm-sans">
                  {pages.length} Page{pages.length > 1 ? 's' : ''} • Drag to reorder
                </span>
              </div>

              {/* Light Table Blueprint Grid */}
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/5 min-h-[400px] p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {pages.map((item) => (
                        <SortablePage
                          key={item.id}
                          id={item.id}
                          item={item}
                          onRotate={handleRotate}
                          onDelete={handleDeletePage}
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
                  Merge Settings
                </h3>

                {/* File list overview */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Source Documents:
                  </span>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="text-xs p-2 bg-muted/40 border border-border/40 rounded-lg flex flex-col gap-0.5 truncate"
                      >
                        <span className="font-bold truncate text-foreground/90 font-manrope">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-dm-sans">
                          {file.pageCount} pages • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional file uploader trigger */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Add more pages:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full relative cursor-pointer"
                    asChild
                  >
                    <label>
                      Upload PDFs
                      <input
                        type="file"
                        accept="application/pdf"
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
                    onClick={handleMerge}
                    disabled={pages.length === 0 || isProcessing}
                    className="w-full font-semibold font-manrope bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/15"
                  >
                    Collate & Merge
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
            className="max-w-2xl mx-auto flex flex-col gap-6"
          >
            <div className="border border-border/60 bg-background/50 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center gap-6 text-center shadow-xl">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <HugeiconsIcon icon={Tick01Icon} className="size-7" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-2xl font-manrope">Collation Complete</h3>
                <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed">
                  Collocated and merged {pages.length} pages into a secure, optimized PDF file. 
                  Zero network uploads occurred during compilation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                  variant="outline"
                  onClick={clearWorkspace}
                  className="flex-1 font-semibold text-xs py-5"
                >
                  Start Over
                </Button>
                <Button
                  asChild
                  className="flex-1 font-semibold text-xs py-5 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/15"
                >
                  <a href={mergedBlobUrl} download={mergedFileName}>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
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
