'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import Image from 'next/image';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import {
  PanelActions,
  PanelPrimaryAction,
  PanelSecondaryAction,
  ToolPanel,
} from '@/components/tools/tool-panel';
import { CanvasSurface } from '@/components/tools/canvas-surface';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { getPdfPageCount, renderPdfPagesToDataUrls } from '@/lib/pdf-utils';
import { formatSize } from '@/lib/format';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Delete02Icon,
  Download01Icon,
  Drag01Icon,
  RotateRightIcon,
} from '@hugeicons/core-free-icons';
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

const tool = requireTool('pdf-organizer');

/** Only the first N pages of a source get a rendered thumbnail. */
const PREVIEW_LIMIT = 30;

type PageRotation = 0 | 90 | 180 | 270;

interface OrganizerSource {
  id: string;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount: number;
}

interface OrganizerPage {
  id: string;
  sourceId: string;
  sourceName: string;
  pageIndex: number;
  thumbnailUrl: string;
  rotation: PageRotation;
  selected: boolean;
}

interface OrganizerState {
  sources: OrganizerSource[];
  pages: OrganizerPage[];
}

interface PDFWorkerResult {
  buffer: ArrayBuffer;
}

/**
 * Order, selection, rotation and deletion all decide what a single export
 * produces, so they live in one reducer rather than in parallel state that can
 * disagree. `DELETE_PAGE` also owns source cleanup: a source whose last page is
 * gone should not keep its buffer alive.
 */
type OrganizerAction =
  | { type: 'APPEND_DOCUMENTS'; sources: OrganizerSource[]; pages: OrganizerPage[] }
  | { type: 'TOGGLE_PAGE'; pageId: string }
  | { type: 'SET_ALL_SELECTED'; selected: boolean }
  | { type: 'ROTATE_PAGE'; pageId: string }
  | { type: 'DELETE_PAGE'; pageId: string }
  | { type: 'REORDER_PAGE'; pageId: string; overId: string }
  | { type: 'RESET' };

function organizerReducer(state: OrganizerState, action: OrganizerAction): OrganizerState {
  switch (action.type) {
    case 'APPEND_DOCUMENTS':
      return {
        sources: [...state.sources, ...action.sources],
        pages: [...state.pages, ...action.pages],
      };

    case 'TOGGLE_PAGE':
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === action.pageId ? { ...page, selected: !page.selected } : page
        ),
      };

    case 'SET_ALL_SELECTED':
      return {
        ...state,
        pages: state.pages.map((page) => ({ ...page, selected: action.selected })),
      };

    case 'ROTATE_PAGE':
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === action.pageId
            ? { ...page, rotation: ((page.rotation + 90) % 360) as PageRotation }
            : page
        ),
      };

    case 'DELETE_PAGE': {
      const pages = state.pages.filter((page) => page.id !== action.pageId);
      const liveSourceIds = new Set(pages.map((page) => page.sourceId));
      return {
        sources: state.sources.filter((source) => liveSourceIds.has(source.id)),
        pages,
      };
    }

    case 'REORDER_PAGE': {
      const from = state.pages.findIndex((page) => page.id === action.pageId);
      const to = state.pages.findIndex((page) => page.id === action.overId);
      if (from === -1 || to === -1) return state;
      return { ...state, pages: arrayMove(state.pages, from, to) };
    }

    case 'RESET':
      return { sources: [], pages: [] };
  }
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

interface OrganizerPageCardProps {
  item: OrganizerPage;
  onToggle: (pageId: string) => void;
  onRotate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}

function OrganizerPageCard({ item, onToggle, onRotate, onDelete }: OrganizerPageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const pageNumber = item.pageIndex + 1;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition-[border-color,box-shadow,scale] duration-200 select-none ${
        isDragging
          ? 'border-category-doc ring-2 ring-category-doc/10 shadow-lg scale-105'
          : item.selected
            ? 'border-border/60'
            : 'border-dashed border-border/70'
      }`}
    >
      {/* The whole bar is the drag handle, not just the icon. An 18px glyph is
          below a comfortable touch target. Grows on coarse pointers. */}
      <div className="flex h-9 items-center border-b border-border/40 bg-muted/20 px-2 [@media(pointer:coarse)]:h-12">
        <div
          {...attributes}
          {...listeners}
          aria-label={`Reorder page ${pageNumber} of ${item.sourceName}`}
          className="flex h-full flex-1 cursor-grab items-center active:cursor-grabbing"
        >
          <HugeiconsIcon
            icon={Drag01Icon}
            className="size-3.5 text-muted-foreground/60"
            aria-hidden
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground/60 transition-[color,background-color] hover:bg-destructive/10 hover:text-destructive [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
          aria-label={`Delete page ${pageNumber} of ${item.sourceName}`}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Page Content / Thumbnail */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/5 p-2.5">
        <div
          className={`relative flex h-full w-full items-center justify-center transition-[transform,opacity] duration-300 ${
            item.selected ? '' : 'opacity-40'
          }`}
          style={{ transform: `rotate(${item.rotation}deg)` }}
        >
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={`Page ${pageNumber} of ${item.sourceName}`}
              fill
              unoptimized
              sizes="(min-width: 640px) 10rem, 50vw"
              className="pointer-events-none rounded object-contain p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border/60 bg-muted/20 px-1 text-center text-xs text-muted-foreground font-dm-sans">
              Not previewed (over {PREVIEW_LIMIT} pages)
            </div>
          )}
        </div>

        {/* Selection sits on the thumbnail rather than in the top bar: sharing
            that row with the delete button squeezed the drag handle down to a
            few pixels on a two-column phone grid. */}
        <label className="absolute left-2 top-2 inline-flex size-6 cursor-pointer items-center justify-center rounded-md border border-border/60 bg-background/90 shadow-sm [@media(pointer:coarse)]:size-11">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => onToggle(item.id)}
            aria-label={`Select page ${pageNumber} of ${item.sourceName}`}
            className="size-3.5 cursor-pointer accent-category-doc [@media(pointer:coarse)]:size-5"
          />
        </label>

        {/* Rotate overlay. The wrapper is inert so the selection control above
            stays clickable, and the button inside re-enables pointer events.
            Revealed on hover only where hover exists; on touch the control has
            to stay visible, or it is unreachable. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(item.id);
            }}
            className="pointer-events-auto size-8 rounded-lg border border-border/40 shadow-sm [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
            aria-label={`Rotate page ${pageNumber} of ${item.sourceName} clockwise`}
          >
            <HugeiconsIcon icon={RotateRightIcon} className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex h-6 items-center gap-1.5 border-t border-border/20 bg-muted/10 px-2">
        <span
          className="flex-1 truncate text-xs text-muted-foreground font-dm-sans"
          title={item.sourceName}
        >
          p. {pageNumber} · {item.sourceName}
        </span>
        {!item.selected ? (
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground/70 font-dm-sans">
            Excluded
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function PDFOrganizerPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [state, dispatch] = useReducer(organizerReducer, { sources: [], pages: [] });
  const { sources, pages } = state;
  const [resultUrl, setResultUrl] = useState('');
  const [resultName, setResultName] = useState('organized_document.pdf');
  // Bumped to remount the picker after a failed batch, which drops the list it
  // holds internally so the next attempt starts clean.
  const [uploadAttempt, setUploadAttempt] = useState(0);

  const selectedPages = pages.filter((page) => page.selected);
  const selectedCount = selectedPages.length;

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
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  /**
   * Every workspace edit changes what the export would contain, so the previous
   * result stops being the answer to "what did I just make" the moment it is
   * touched. Clearing the URL also revokes it through the effect above.
   */
  const applyAction = useCallback((action: OrganizerAction) => {
    setResultUrl('');
    dispatch(action);
  }, []);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const outcome = await task.runTask(
      async (report) => {
        report(5, 'Reading document structures…');

        const newSources: OrganizerSource[] = [];
        const newPages: OrganizerPage[] = [];

        for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex++) {
          const file = selectedFiles[fileIndex];
          const buffer = await file.arrayBuffer();
          const pageCount = await getPdfPageCount(buffer);
          const sourceId = crypto.randomUUID();

          newSources.push({
            id: sourceId,
            name: file.name,
            size: file.size,
            buffer,
            pageCount,
          });

          // Limit initial thumbnail generation to the preview window to prevent
          // the browser locking up on long documents.
          const previewCount = Math.min(pageCount, PREVIEW_LIMIT);
          const thumbnails = await renderPdfPagesToDataUrls(
            buffer,
            Array.from({ length: previewCount }, (_, index) => index + 1),
            0.35,
            (current, total) => {
              report(
                Math.round(5 + ((fileIndex + current / total) / selectedFiles.length) * 85),
                `Rendering thumbnail for ${file.name} (page ${current}/${total})…`
              );
            }
          );

          for (let index = 0; index < pageCount; index++) {
            newPages.push({
              id: `${sourceId}-${index}`,
              sourceId,
              sourceName: file.name,
              pageIndex: index,
              thumbnailUrl: thumbnails[index] ?? '', // Placeholder past the preview window
              rotation: 0,
              selected: true,
            });
          }
        }

        return { sources: newSources, pages: newPages };
      },
      {
        initialMessage: 'Reading document structures…',
        errorMessage:
          'Could not read the uploaded PDF. A file may be corrupted or password-protected.',
      }
    );

    if (!outcome.ok) {
      // The picker keeps its own list of chosen files, so without this the next
      // attempt resends the file that just failed and fails the same way again.
      setUploadAttempt((attempt) => attempt + 1);
      return;
    }
    applyAction({ type: 'APPEND_DOCUMENTS', ...outcome.value });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    applyAction({
      type: 'REORDER_PAGE',
      pageId: String(active.id),
      overId: String(over.id),
    });
  };

  const handleExport = async () => {
    if (selectedCount === 0) return;

    const url = await task.runTask(
      async (report) => {
        // Only the sources the selection actually references travel to the
        // worker, and page order in this array is the page order in the output.
        const liveSourceIds = new Set(selectedPages.map((page) => page.sourceId));
        const activeSources = sources.filter((source) => liveSourceIds.has(source.id));
        const sourceIndex = new Map(activeSources.map((source, index) => [source.id, index]));

        const filesPayload = activeSources.map((source) => ({
          name: source.name,
          buffer: source.buffer.slice(0), // Transferable buffer copy
        }));

        // Falling back to 0 here would quietly export a page from the wrong
        // document, so a miss has to fail loudly instead.
        const pagesPayload = selectedPages.map((page) => {
          const fileIndex = sourceIndex.get(page.sourceId);
          if (fileIndex === undefined) {
            throw new Error(`Page references a document that is no longer loaded: ${page.id}`);
          }
          return { fileIndex, pageIndex: page.pageIndex, rotation: page.rotation };
        });

        report(0, 'Assembling selected pages in Web Worker…');
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
        setResultName(`organized_document_${createDownloadId()}.pdf`);
        return URL.createObjectURL(blob);
      },
      {
        initialMessage: 'Preparing page pipeline…',
        errorMessage: 'PDF export failed. Please try again.',
      }
    );

    if (url.ok) setResultUrl(url.value);
  };

  const clearWorkspace = () => {
    setResultUrl('');
    dispatch({ type: 'RESET' });
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
            key={uploadAttempt}
            accept="application/pdf"
            multiple={true}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF documents to organize (multiple allowed)"
          />
        </div>
      ) : !resultUrl ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Page workspace (Grid). Ordered second on a phone so the panel,
                and its export action, sit before a grid that can run to dozens
                of pages. */}
            <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-3">
              <div className="flex flex-col gap-3 border-b border-border/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-sm font-manrope flex items-center gap-2">
                  <span
                    className={`flex h-2 w-2 rounded-full ${ACCENTS[tool.category].bar}`}
                    aria-hidden
                  />
                  Page organizer workspace
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground font-dm-sans">
                    {selectedCount} of {pages.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyAction({ type: 'SET_ALL_SELECTED', selected: true })}
                    disabled={selectedCount === pages.length}
                    className="text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                  >
                    Select all
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyAction({ type: 'SET_ALL_SELECTED', selected: false })}
                    disabled={selectedCount === 0}
                    className="text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                  >
                    Select none
                  </Button>
                </div>
              </div>

              <CanvasSurface>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pages.map((page) => page.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {pages.map((item) => (
                        <OrganizerPageCard
                          key={item.id}
                          item={item}
                          onToggle={(pageId) => applyAction({ type: 'TOGGLE_PAGE', pageId })}
                          onRotate={(pageId) => applyAction({ type: 'ROTATE_PAGE', pageId })}
                          onDelete={(pageId) => applyAction({ type: 'DELETE_PAGE', pageId })}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CanvasSurface>
            </div>

            {/* Sidebar Controls */}
            <div className="order-1 lg:order-2 lg:col-span-1">
              <ToolPanel title="Organizer settings" sticky>
                {/* File list overview */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Source Documents:
                  </span>
                  <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="flex flex-col gap-0.5 truncate rounded-lg border border-border/40 bg-muted/40 p-2 text-xs"
                      >
                        <span className="truncate font-bold text-foreground/90 font-manrope">
                          {source.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-dm-sans">
                          {source.pageCount} pages • {formatSize(source.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional file uploader trigger */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-foreground/80 font-dm-sans">
                    Add more documents:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative w-full cursor-pointer"
                    asChild
                  >
                    <label>
                      Add PDFs
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const fileList = Array.from(e.target.files || []);
                          // Reset so picking the same file again still fires.
                          e.target.value = '';
                          handleFilesSelected(fileList);
                        }}
                      />
                    </label>
                  </Button>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                  Drag pages into order, rotate or delete the ones you do not want, then export
                  only the pages you keep. Unselected pages stay in the workspace.
                </p>

                <PanelActions>
                  <PanelPrimaryAction
                    category={tool.category}
                    onClick={handleExport}
                    disabled={selectedCount === 0 || task.isProcessing}
                  >
                    Export {selectedCount} Page{selectedCount === 1 ? '' : 's'}
                  </PanelPrimaryAction>
                  <PanelSecondaryAction onClick={clearWorkspace} disabled={task.isProcessing}>
                    Clear Workspace
                  </PanelSecondaryAction>
                </PanelActions>
              </ToolPanel>
            </div>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Export Complete"
          description={`Exported ${selectedCount} of ${pages.length} pages in your selected order. Zero network uploads occurred during assembly.`}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => setResultUrl('')}
                className="flex-1 font-semibold text-xs py-5"
              >
                Continue Organizing
              </Button>
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
