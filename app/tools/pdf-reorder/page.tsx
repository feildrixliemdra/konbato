'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { CanvasSurface } from '@/components/tools/canvas-surface';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { getPdfPageCount, renderPdfPagesToDataUrls } from '@/lib/pdf-utils';
import { formatSize } from '@/lib/format';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, Drag01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
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

const tool = requireTool('pdf-reorder');

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
      className={`group relative aspect-[3/4] overflow-hidden rounded-xl border bg-background shadow-sm transition-[border-color,box-shadow,scale] duration-200 select-none ${
        isDragging
          ? 'border-category-doc ring-2 ring-category-doc/10 shadow-lg scale-105'
          : 'border-border/60'
      }`}
    >
      {/* The whole bar is the drag handle, not just the icon. An 18px glyph is
          below a comfortable touch target. Grows on coarse pointers. */}
      <div className="flex h-9 items-center justify-between border-b border-border/40 bg-muted/20 px-2 [@media(pointer:coarse)]:h-12">
        <div
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="flex h-full flex-1 cursor-grab items-center rounded active:cursor-grabbing"
        >
          <HugeiconsIcon
            icon={Drag01Icon}
            className="size-3.5 text-muted-foreground/60"
            aria-hidden
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground font-dm-sans">
          Page {item.pageIndex + 1}
        </span>
      </div>

      <div className="relative flex h-[calc(100%-2.25rem)] items-center justify-center bg-muted/5 p-2.5">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={`Page ${item.pageIndex + 1} preview`}
            fill
            unoptimized
            sizes="(min-width: 768px) 12rem, 50vw"
            className="rounded object-contain p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] pointer-events-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border/60 bg-muted/20 px-1 text-center text-xs text-muted-foreground font-dm-sans">
            Not previewed (over 30 pages)
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
  const task = useToolTask();

  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
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

    const outcome = await task.runTask(
      async (report) => {
        report(10, 'Reading PDF pages…');

        const targetFile = selectedFiles[0];
        const buffer = await targetFile.arrayBuffer();
        const pageCount = await getPdfPageCount(buffer);
        const nextPages: PDFPageItem[] = [];
        const previewCount = Math.min(pageCount, 30);

        const thumbnails = await renderPdfPagesToDataUrls(
          buffer,
          Array.from({ length: previewCount }, (_, index) => index + 1),
          0.35,
          (current, total) => {
            report(
              Math.round(10 + (current / total) * 80),
              `Rendering page thumbnail ${current} of ${total}…`
            );
          }
        );

        for (let index = 0; index < previewCount; index++) {
          nextPages.push({
            id: `page-${index}`,
            pageIndex: index,
            thumbnailUrl: thumbnails[index],
          });
        }

        for (let index = previewCount; index < pageCount; index++) {
          nextPages.push({
            id: `page-${index}`,
            pageIndex: index,
            thumbnailUrl: '',
          });
        }

        return {
          name: targetFile.name,
          size: targetFile.size,
          buffer,
          pageCount,
          nextPages,
        };
      },
      {
        initialMessage: 'Reading PDF pages…',
        errorMessage:
          'Could not read this PDF. The file may be corrupted or password-protected.',
      }
    );

    if (!outcome.ok) return;
    const { name, size, buffer, pageCount, nextPages } = outcome.value;

    setFile({ name, size, buffer, pageCount });
    setPages(nextPages);
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

    const url = await task.runTask(
      async (report) => {
        report(0, 'Exporting reordered PDF…');
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
            report(pct, msg);
          }
        );

        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        setResultName(`reordered_${file.name}`);
        return URL.createObjectURL(blob);
      },
      {
        initialMessage: 'Exporting reordered PDF…',
        errorMessage: 'PDF reorder failed. Please try again.',
      }
    );

    if (url.ok) setResultUrl(url.value);
  };

  const clearWorkspace = () => {
    setFile(null);
    setPages([]);
    setResultUrl('');
    setResultName('reordered_document.pdf');
    task.reset();
  };

  return (
    <ToolPageShell
      title={tool.title}
      description={tool.description}
      icon={tool.icon}
      category={tool.category}
      width="wide"
    >
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to reorder pages"
          />
        </div>
      ) : !resultUrl ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex flex-col gap-2 border-b border-border/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span
                    className={`flex h-2 w-2 rounded-full ${ACCENTS[tool.category].bar}`}
                    aria-hidden
                  />
                  Page reorder workspace
                </h3>
                <span className="text-xs text-muted-foreground font-dm-sans">
                  {pages.length} page{pages.length > 1 ? 's' : ''} - drag to reorder
                </span>
              </div>

              <CanvasSurface>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pages.map((page) => page.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {pages.map((page) => (
                        <SortablePage key={page.id} item={page} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CanvasSurface>
            </div>

            <ToolPanel title="Document" sticky>
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-category-doc/10 text-category-doc">
                  <HugeiconsIcon icon={File01Icon} className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 text-xs font-dm-sans">
                  <p className="truncate font-bold text-foreground">{file.name}</p>
                  <p className="text-muted-foreground">
                    {file.pageCount} pages - {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-dm-sans leading-relaxed">
                Reordering keeps the original page content and writes a new PDF with your selected page sequence.
              </p>
              <PanelPrimaryAction category={tool.category}
                onClick={handleExport}
                disabled={task.isProcessing || pages.length === 0}
              >
                Export Reordered PDF
              </PanelPrimaryAction>
              <PanelSecondaryAction
                onClick={clearWorkspace}
                disabled={task.isProcessing}
              >
                Change File
              </PanelSecondaryAction>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Reorder Complete"
          description={`Exported ${pages.length} page${pages.length > 1 ? 's' : ''} using your selected order.`}
          actions={
            <>
              <Button
                variant="outline"
                onClick={clearWorkspace}
                className="flex-1 font-semibold text-xs py-5"
              >
                Start Over
              </Button>
              <Button
                asChild
                className={`flex-1 font-semibold text-xs py-5 ${ACCENTS[tool.category].button}`}
              >
                <a href={resultUrl} download={resultName}>
                  <HugeiconsIcon icon={Download01Icon} className="size-4 mr-2" aria-hidden />
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
