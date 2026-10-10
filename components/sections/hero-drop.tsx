'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  Image01Icon,
  Pdf01Icon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';
import { formatSize } from '@/lib/format';
import { stageFiles } from '@/lib/file-handoff';
import {
  ACCENTS,
  IMAGE_TOOLS,
  PDF_TOOLS,
  accentTile,
  requireTool,
  type Tool,
  type ToolCategory,
} from '@/lib/tools';
import { cn } from '@/lib/utils';

/*
 * The hero's drop surface.
 *
 * The product is "drop a file, get it back", so the hero shows that instead
 * of describing it. This surface takes a file before a tool has been chosen,
 * says what it is, and lists only the tools that can open it. Choosing one
 * stages the file (see lib/file-handoff) so the tool's own upload zone picks
 * it up on arrival and nobody selects the same file twice.
 *
 * It is deliberately not the FileUploadZone from the tools: that one owns a
 * selected-files list and a device warning, both of which belong to a tool
 * that is about to do work. This one only has to route.
 */

type Kind = 'image' | 'heic' | 'pdf' | 'unknown';

function extensionOf(file: File): string {
  return file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
}

/*
 * HEIC is its own kind. Windows browsers report an empty MIME type for it, so
 * tools that accept `image/*` would reject it on arrival. Only the converter
 * declares `.heic`, so that is the only tool offered for one.
 *
 * Every other image is classified by MIME type alone, not extension: the
 * image tools accept `image/*`, which the upload zone matches against
 * `file.type`, so a `.tif` the browser reports with an empty type would be
 * offered a tool that then rejects it. Better to say so here.
 */
function kindOf(file: File): Kind {
  const ext = extensionOf(file);
  if (file.type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
    return 'heic';
  }
  if (file.type.startsWith('image/')) return 'image';
  return 'unknown';
}

/** Mirrors the accept list in app/tools/image-to-pdf/page.tsx, which has no `image/*`. */
const PDF_FROM_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/tiff',
  'image/bmp',
]);

/** Featured tools first, so the most likely job is the first button. */
function byProminence(a: Tool, b: Tool): number {
  return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
}

const TARGETS: Record<Exclude<Kind, 'unknown'>, Tool[]> = {
  image: [...IMAGE_TOOLS, requireTool('image-to-pdf')].sort(byProminence),
  heic: [requireTool('image-convert')],
  pdf: PDF_TOOLS.filter((tool) => tool.slug !== 'image-to-pdf').sort(byProminence),
};

const KIND_LABEL: Record<Kind, string> = {
  image: 'Image',
  heic: 'HEIC photo',
  pdf: 'PDF',
  unknown: 'Unsupported',
};

const ACCEPT = 'image/*,.heic,.heif,application/pdf,.pdf';

interface Picked {
  files: File[];
  kind: Kind;
  /** Images and PDFs together: no single tool takes both. */
  mixed: boolean;
  /** The first file no tool opens, if any. */
  unsupported?: File;
}

function pick(list: ArrayLike<File>): Picked {
  const files = Array.from(list);
  const kinds = files.map(kindOf);
  const unsupported = files.find((_, index) => kinds[index] === 'unknown');
  const hasPdf = kinds.includes('pdf');
  const hasImage = kinds.includes('image') || kinds.includes('heic');
  // HEIC and other images are one family; one HEIC in the batch narrows the
  // batch to the converter, since it is the only tool that opens both.
  const kind: Kind = unsupported
    ? 'unknown'
    : hasPdf
      ? 'pdf'
      : kinds.includes('heic')
        ? 'heic'
        : 'image';
  return { files, kind, mixed: hasPdf && hasImage, unsupported };
}

function toolsFor({ kind, files }: Picked): Tool[] {
  if (kind === 'unknown') return [];
  if (kind === 'image' && !files.every((file) => PDF_FROM_IMAGE_TYPES.has(file.type))) {
    return TARGETS.image.filter((tool) => tool.slug !== 'image-to-pdf');
  }
  return TARGETS[kind];
}

function categoryOf(kind: Kind): ToolCategory {
  return kind === 'pdf' ? 'PDF' : 'Image';
}

export function HeroDrop({ className }: { className?: string }) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [dragging, setDragging] = useState(false);
  // Child elements fire their own dragenter/dragleave, so a plain boolean
  // flickers as the pointer crosses them. A depth counter does not.
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const idleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /*
   * The surface swaps between the idle button and the picked panel, and the
   * element that had focus unmounts each time. Set by the handlers that cause
   * the swap, so focus moves into the new surface only after a user action,
   * never on first render.
   */
  const moveFocus = useRef(false);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const target = picked
      ? (panelRef.current?.querySelector<HTMLElement>('ul a') ??
        panelRef.current?.querySelector<HTMLElement>('button'))
      : idleRef.current;
    target?.focus();
  }, [picked]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const onDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (event.dataTransfer.files.length) {
      moveFocus.current = true;
      setPicked(pick(event.dataTransfer.files));
    }
  }, []);

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      moveFocus.current = true;
      setPicked(pick(event.target.files));
    }
    event.target.value = '';
  }, []);

  const reset = useCallback(() => {
    moveFocus.current = true;
    setPicked(null);
  }, []);

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'rounded-3xl bg-card p-2.5 shadow-raised transition-[box-shadow,translate] duration-300',
        dragging && '-translate-y-1',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={onChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      {picked ? (
        <PickedPanel ref={panelRef} picked={picked} onReset={reset} onChoose={openPicker} />
      ) : (
        <button
          ref={idleRef}
          type="button"
          onClick={openPicker}
          className={cn(
            'flex min-h-[19rem] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-[background-color,border-color] duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:min-h-[22rem]',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background/60 hover:border-primary/50 hover:bg-primary/[0.03]'
          )}
        >
          <span
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-colors',
              dragging && 'bg-primary/10 text-primary'
            )}
          >
            <HugeiconsIcon icon={Upload01Icon} className="h-7 w-7" aria-hidden />
          </span>
          <span className="mt-6 text-2xl font-bold font-manrope tracking-tight">
            {dragging ? 'Let go to open it' : 'Drop a file here'}
          </span>
          <span className="mt-2 text-sm text-muted-foreground font-dm-sans">
            or choose one from this device
          </span>
          <span className="mt-8 text-xs text-muted-foreground font-dm-sans">
            JPG, PNG, WebP, HEIC, GIF, TIFF and PDF. It stays on this device.
          </span>
        </button>
      )}
    </div>
  );
}

function PickedPanel({
  ref,
  picked,
  onReset,
  onChoose,
}: {
  ref: React.Ref<HTMLDivElement>;
  picked: Picked;
  onReset: () => void;
  onChoose: () => void;
}) {
  const { files, kind, mixed, unsupported } = picked;
  const first = files[0];
  const category = categoryOf(kind);
  const tools = toolsFor(picked);
  const routable = !mixed && tools.length > 0;
  const total = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div
      ref={ref}
      className="flex min-h-[19rem] flex-col rounded-2xl border border-border bg-background/60 p-5 sm:min-h-[22rem] sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            kind === 'unknown' ? 'bg-muted text-muted-foreground' : accentTile(category)
          )}
        >
          <HugeiconsIcon
            icon={kind === 'pdf' ? Pdf01Icon : Image01Icon}
            className="h-5 w-5"
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold font-manrope">{first.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground font-dm-sans">
            {mixed ? 'Images and PDFs' : KIND_LABEL[kind]}
            {files.length > 1 ? `, ${files.length} files` : ''}, {formatSize(total)}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          aria-label="Remove this file and choose another"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {routable ? (
        <>
          <p className="mt-6 text-sm font-semibold font-manrope">
            {files.length > 1 ? 'What do you want to do with them?' : 'What do you want to do with it?'}
          </p>
          {kind === 'heic' ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-dm-sans">
              Convert it to JPG, PNG or WebP first. The other image tools take it from there.
            </p>
          ) : null}
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={tool.href}
                  onClick={(event) => {
                    // A modified click opens a new tab and leaves this one
                    // where it is, so staging here would plant the file in
                    // whatever tool this tab opens next.
                    if (
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey ||
                      event.button !== 0
                    ) {
                      return;
                    }
                    stageFiles(files);
                  }}
                  className="group flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold font-manrope transition-[border-color,background-color] hover:border-primary/60 hover:bg-primary/5 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <HugeiconsIcon
                    icon={tool.icon}
                    className={cn('h-4 w-4 shrink-0', ACCENTS[tool.category].icon)}
                    aria-hidden
                  />
                  <span className="truncate">{tool.shortLabel ?? tool.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl bg-muted/50 p-5 text-center">
          <p className="text-sm font-semibold font-manrope">
            {mixed ? 'Drop images or PDFs, not both at once' : 'Konbato opens images and PDFs'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground font-dm-sans">
            {mixed
              ? 'Each tool works on one kind of file. Choose the images or the PDFs on their own.'
              : `There is no tool here for ${(unsupported ?? first).name}.`}
          </p>
          <button
            type="button"
            onClick={onChoose}
            className="mx-auto mt-4 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Choose a different file
          </button>
        </div>
      )}
    </div>
  );
}
