'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  ArrangeIcon,
  ArrowLeft01Icon,
  Download01Icon,
  Drag01Icon,
  File01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PDFFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount: number;
}

interface PDFPageItem {
  id: string;
  pageIndex: number;
  thumbnailUrl: string;
}

interface PDFWorkerResult {
  buffer: ArrayBuffer;
}

interface SortablePageProps {
  item: PDFPageItem;
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
}

function SortablePage({ item }: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-[3/4] overflow-hidden rounded-xl border bg-background shadow-sm transition-all duration-200 select-none ${
        isDragging
          ? 'border-red-500 ring-2 ring-red-500/10 shadow-lg scale-105'
          : 'border-border/60 hover:border-border-hover'
      }`}
    >
      <div className="flex h-8 items-center justify-between border-b border-border/40 bg-muted/20 px-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground/80 active:cursor-grabbing"
          title="Drag to reorder"
        >
          <HugeiconsIcon icon={Drag01Icon} className="size-3.5" />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground font-dm-sans">
          Page {item.pageIndex + 1}
        </span>
      </div>

      <div className="flex h-[calc(100%-2rem)] items-center justify-center bg-muted/5 p-2.5">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={`Page ${item.pageIndex + 1} preview`}
            className="max-h-full max-w-full rounded object-contain shadow-[0_1px_3px_rgba(0,0,0,0.05)] pointer-events-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border/60 bg-muted/20 text-[10px] text-muted-foreground font-dm-sans">
            Preview unavailable
          </div>
        )}
      </div>
    </div>
  );
}

export default function PDFReorderPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);

  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [resultName, setResultName] = useState('reordered_document.pdf');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setResultUrl('');
    setResultName('reordered_document.pdf');
    setIsProcessing(true);
    setProgress(10);
    setProgressMessage('Reading PDF pages...');

    try {
      const targetFile = selectedFiles[0];
      const buffer = await targetFile.arrayBuffer();
      const pageCount = await getPdfPageCount(buffer);
      const nextPages: PDFPageItem[] = [];
      const previewCount = Math.min(pageCount, 30);

      for (let index = 0; index < previewCount; index++) {
        setProgressMessage(`Rendering page thumbnail ${index + 1} of ${previewCount}...`);
        nextPages.push({
          id: `page-${index}`,
          pageIndex: index,
          thumbnailUrl: await renderPdfPageToDataUrl(buffer, index + 1),
        });
        setProgress(Math.round(10 + ((index + 1) / previewCount) * 80));
      }

      for (let index = previewCount; index < pageCount; index++) {
        nextPages.push({
          id: `page-${index}`,
          pageIndex: index,
          thumbnailUrl: '',
        });
      }

      setFile({
        name: targetFile.name,
        size: targetFile.size,
        buffer,
        pageCount,
      });
      setPages(nextPages);
      setProgress(100);
      setProgressMessage('');
    } catch (err) {
      console.error(err);
      setProgressMessage('Failed to parse uploaded PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPages((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleExport = async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setResultUrl('');
    setProgressMessage('Exporting reordered PDF...');

    try {
      const response = await postTask<
        {
          files: { name: string; buffer: ArrayBuffer }[];
          pages: { fileIndex: number; pageIndex: number; rotation: number }[];
        },
        PDFWorkerResult
      >(
        'MERGE_SPLIT_ROTATE',
        {
          files: [{ name: file.name, buffer: file.buffer.slice(0) }],
          pages: pages.map((page) => ({
            fileIndex: 0,
            pageIndex: page.pageIndex,
            rotation: 0,
          })),
        },
        (pct, msg) => {
          setProgress(pct);
          if (msg) setProgressMessage(msg);
        }
      );

      const blob = new Blob([response.buffer], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
      setResultName(`reordered_${file.name}`);
      setProgress(100);
      setProgressMessage('Reorder complete.');
    } catch (err) {
      console.error(err);
      setProgressMessage('PDF reorder failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearWorkspace = () => {
    setFile(null);
    setPages([]);
    setResultUrl('');
    setResultName('reordered_document.pdf');
    setProgressMessage('');
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
              <HugeiconsIcon icon={ArrangeIcon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">PDF Page Reorder</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-2xl">
            Drag PDF pages into a new sequence and export a reordered file entirely in your browser.
          </p>
        </div>

        {!file ? (
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to reorder pages"
          />
        ) : !resultUrl ? (
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex flex-col gap-2 border-b border-border/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  Page reorder workspace
                </h3>
                <span className="text-xs text-muted-foreground font-dm-sans">
                  {pages.length} page{pages.length > 1 ? 's' : ''} - drag to reorder
                </span>
              </div>

              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/5 min-h-[400px] p-4 sm:p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pages.map((page) => page.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {pages.map((page) => (
                        <SortablePage key={page.id} item={page} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
              <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                Document
              </h3>
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <HugeiconsIcon icon={File01Icon} className="size-4" />
                </div>
                <div className="min-w-0 text-xs font-dm-sans">
                  <p className="truncate font-bold text-foreground">{file.name}</p>
                  <p className="text-muted-foreground">{file.pageCount} pages - {formatSize(file.size)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-dm-sans leading-relaxed">
                Reordering keeps the original page content and writes a new PDF with your selected page sequence.
              </p>
              <Button
                onClick={handleExport}
                disabled={isProcessing || pages.length === 0}
                className="w-full font-semibold font-manrope bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/15"
              >
                Export Reordered PDF
              </Button>
              <Button variant="ghost" onClick={clearWorkspace} disabled={isProcessing} className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground">
                Change File
              </Button>
            </Card>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
            <Card className="p-8 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col items-center gap-6 text-center shadow-xl">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <HugeiconsIcon icon={Tick01Icon} className="size-7" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-2xl font-manrope">Reorder Complete</h3>
                <p className="text-sm text-muted-foreground font-dm-sans">
                  Exported {pages.length} page{pages.length > 1 ? 's' : ''} using your selected order.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={clearWorkspace} className="flex-1 font-semibold text-xs py-5">
                  Start Over
                </Button>
                <Button asChild className="flex-1 font-semibold text-xs py-5 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/15">
                  <a href={resultUrl} download={resultName}>
                    <HugeiconsIcon icon={Download01Icon} className="size-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </Card>
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
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
