'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { PanelActions, PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { CanvasSurface } from '@/components/tools/canvas-surface';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { getPdfPageCount, renderPdfPagesToDataUrls } from '@/lib/pdf-utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Drag01Icon,
  Download01Icon,
  Delete02Icon,
  RotateRightIcon,
} from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
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

const tool = requireTool('pdf-merge');

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
          ? 'border-category-doc ring-2 ring-category-doc/10 shadow-lg scale-105'
          : 'border-border/60'
      } transition-[border-color,box-shadow,scale] duration-200 select-none`}
    >
      {/* Top bar: the whole bar is the drag handle, not just the icon. An 18px
          glyph is below a comfortable touch target. Grows on coarse pointers. */}
      <div className="flex h-9 items-center justify-between border-b border-border/40 bg-muted/20 px-2 [@media(pointer:coarse)]:h-12">
        <div
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="flex h-full flex-1 cursor-grab items-center active:cursor-grabbing"
        >
          <HugeiconsIcon
            icon={Drag01Icon}
            className="size-3.5 text-muted-foreground/60"
            aria-hidden
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground font-dm-sans">
          p. {item.pageIndex + 1}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground/60 transition-[color,background-color] hover:bg-destructive/10 hover:text-destructive [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
          aria-label="Remove page"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Page Content / Thumbnail */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center p-2.5 bg-muted/5">
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${item.rotation}deg)` }}
        >
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={`Page ${item.pageIndex + 1} of ${item.fileName}`}
              fill
              unoptimized
              sizes="(min-width: 640px) 10rem, 50vw"
              className="object-contain p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded pointer-events-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border/60 bg-muted/20 px-1 text-center text-xs text-muted-foreground font-dm-sans">
              Not previewed (over 30 pages)
            </div>
          )}
        </div>

        {/* Rotate button overlay.
            Revealed on hover only where hover exists; on touch the control has
            to stay visible, or it is unreachable. */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(id);
            }}
            className="size-8 rounded-lg shadow-sm border border-border/40 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
            aria-label="Rotate 90° clockwise"
          >
            <HugeiconsIcon icon={RotateRightIcon} className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="h-6 px-2 bg-muted/10 flex items-center border-t border-border/20 truncate">
        <span
          className="text-xs text-muted-foreground truncate font-dm-sans w-full"
          title={item.fileName}
        >
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
  const task = useToolTask();

  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
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

    const outcome = await task.runTask(
      async (report) => {
        report(10, 'Reading document structures…');

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
          const thumbnails = await renderPdfPagesToDataUrls(
            buffer,
            Array.from({ length: renderPagesCount }, (_, index) => index + 1),
            0.35,
            (current, total) => {
              report(10, `Rendering thumbnail for ${file.name} (page ${current}/${total})…`);
            }
          );

          for (let p = 0; p < renderPagesCount; p++) {
            newPagesList.push({
              id: `${fileId}-${p}`,
              fileId,
              fileName: file.name,
              pageIndex: p,
              thumbnailUrl: thumbnails[p],
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

        return { newFiles, newPagesList };
      },
      {
        initialMessage: 'Reading document structures…',
        errorMessage:
          'Could not read the uploaded PDF. A file may be corrupted or password-protected.',
      }
    );

    if (!outcome.ok) return;

    setFiles((prev) => [...prev, ...outcome.value.newFiles]);
    setPages((prev) => [...prev, ...outcome.value.newPagesList]);
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

    const url = await task.runTask(
      async (report) => {
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

        report(0, 'Merging and rotating pages in Web Worker…');
        const result = await postTask<
          {
            files: { name: string; buffer: ArrayBuffer }[];
            pages: { fileIndex: number; pageIndex: number; rotation: number }[];
          },
          PDFWorkerResult
        >(
          'MERGE_SPLIT_ROTATE',
          { files: filesPayload, pages: pagesPayload },
          (pct, msg) => {
            report(pct, msg);
          }
        );

        const blob = new Blob([result.buffer], { type: 'application/pdf' });
        setMergedFileName(`collated_document_${createDownloadId()}.pdf`);
        return URL.createObjectURL(blob);
      },
      {
        initialMessage: 'Preparing collation pipeline…',
        errorMessage: 'PDF merging failed. Please try again.',
      }
    );

    if (url.ok) setMergedBlobUrl(url.value);
  };

  const clearWorkspace = () => {
    setFiles([]);
    setPages([]);
    setMergedBlobUrl('');
    setMergedFileName('collated_document.pdf');
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
      {pages.length === 0 ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone
            accept="application/pdf"
            multiple={true}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF documents to collate (multiple allowed)"
          />
        </div>
      ) : !mergedBlobUrl ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Light Table Collation Workspace (Grid) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span
                    className={`flex h-2 w-2 rounded-full ${ACCENTS[tool.category].bar}`}
                    aria-hidden
                  />
                  Light Table Collation
                </h3>
                <span className="text-xs text-muted-foreground font-dm-sans">
                  {pages.length} Page{pages.length > 1 ? 's' : ''} • Drag to reorder
                </span>
              </div>

              {/* Light Table Blueprint Grid */}
              <CanvasSurface>
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
              </CanvasSurface>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-1">
              <ToolPanel title="Merge settings" sticky>

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
                        <span className="text-xs text-muted-foreground font-dm-sans">
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

                <PanelActions>
                  <PanelPrimaryAction category={tool.category}
                    onClick={handleMerge}
                    disabled={pages.length === 0 || task.isProcessing}
                  >
                    Collate &amp; Merge
                  </PanelPrimaryAction>
                  <PanelSecondaryAction
                    onClick={clearWorkspace}
                    disabled={task.isProcessing}
                  >
                    Reset Workspace
                  </PanelSecondaryAction>
                </PanelActions>
              </ToolPanel>
            </div>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Collation Complete"
          description={`Collocated and merged ${pages.length} pages into a secure, optimized PDF file. Zero network uploads occurred during compilation.`}
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
                <a href={mergedBlobUrl} download={mergedFileName}>
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
