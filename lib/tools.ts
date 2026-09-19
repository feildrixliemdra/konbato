import type { IconSvgElement } from '@hugeicons/react';
import {
  Image01Icon,
  File01Icon,
  RotateClockwiseIcon,
  Layers01Icon,
  SplitIcon,
  ArrowShrink01Icon,
  ColorsIcon,
  ImageCropIcon,
  Shield01Icon,
  ArrangeIcon,
} from '@hugeicons/core-free-icons';

export type ToolCategory = 'Image' | 'PDF';

export type AccentKey =
  | 'blue'
  | 'emerald'
  | 'cyan'
  | 'teal'
  | 'indigo'
  | 'red'
  | 'orange'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'sky';

export interface AccentClasses {
  /** `bg-*`, `text-*` and `border-*` for icon tiles. */
  tile: string;
  /** Text-only color, e.g. for inline icons. */
  icon: string;
  /** Solid fill for progress bars and accent dots. */
  bar: string;
  /** Solid CTA button styling. */
  button: string;
  /** Gradient stops for decorative borders and accent lines. */
  gradient: string;
}

export const ACCENTS: Record<AccentKey, AccentClasses> = {
  blue: {
    tile: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: 'text-blue-500',
    bar: 'bg-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/15',
    gradient: 'from-blue-500/50 to-blue-600/50',
  },
  emerald: {
    tile: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: 'text-emerald-500',
    bar: 'bg-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/15',
    gradient: 'from-emerald-500/50 to-emerald-600/50',
  },
  cyan: {
    tile: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    icon: 'text-cyan-500',
    bar: 'bg-cyan-500',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/15',
    gradient: 'from-cyan-500/50 to-cyan-600/50',
  },
  teal: {
    tile: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    icon: 'text-teal-500',
    bar: 'bg-teal-500',
    button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/15',
    gradient: 'from-teal-500/50 to-teal-600/50',
  },
  indigo: {
    tile: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    icon: 'text-indigo-500',
    bar: 'bg-indigo-500',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/15',
    gradient: 'from-indigo-500/50 to-indigo-600/50',
  },
  red: {
    tile: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: 'text-red-500',
    bar: 'bg-red-500',
    button: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/15',
    gradient: 'from-red-500/50 to-red-600/50',
  },
  orange: {
    tile: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    icon: 'text-orange-500',
    bar: 'bg-orange-500',
    button: 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/15',
    gradient: 'from-orange-500/50 to-orange-600/50',
  },
  amber: {
    tile: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    icon: 'text-amber-500',
    bar: 'bg-amber-500',
    button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/15',
    gradient: 'from-amber-500/50 to-amber-600/50',
  },
  rose: {
    tile: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    icon: 'text-rose-500',
    bar: 'bg-rose-500',
    button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15',
    gradient: 'from-rose-500/50 to-rose-600/50',
  },
  slate: {
    tile: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: 'text-slate-500',
    bar: 'bg-slate-500',
    button: 'bg-slate-700 hover:bg-slate-800 text-white shadow-lg shadow-slate-700/15',
    gradient: 'from-slate-500/50 to-slate-600/50',
  },
  sky: {
    tile: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    icon: 'text-sky-500',
    bar: 'bg-sky-500',
    button: 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/15',
    gradient: 'from-sky-500/50 to-sky-600/50',
  },
};

/** Icon-tile classes including the 1px border width. */
export function accentTile(accent: AccentKey): string {
  return `border ${ACCENTS[accent].tile}`;
}

export interface Tool {
  slug: string;
  href: string;
  title: string;
  shortLabel?: string;
  description: string;
  category: ToolCategory;
  icon: IconSvgElement;
  accent: AccentKey;
  featured?: boolean;
}

export const TOOLS: Tool[] = [
  {
    slug: 'image-compress',
    href: '/tools/image-compress',
    title: 'Image Compress',
    description: 'Optimize image file size client-side without losing visual quality.',
    category: 'Image',
    icon: ArrowShrink01Icon,
    accent: 'emerald',
    featured: true,
  },
  {
    slug: 'image-convert',
    href: '/tools/image-convert',
    title: 'Image Converter',
    description: 'Convert JPG, PNG, WEBP, GIF, and TIFF images instantly to other formats.',
    category: 'Image',
    icon: Image01Icon,
    accent: 'blue',
    featured: true,
  },
  {
    slug: 'image-resize-crop',
    href: '/tools/image-resize-crop',
    title: 'Image Resize & Crop',
    shortLabel: 'Resize & Crop',
    description: 'Crop by preset or numeric bounds, then resize into PNG, JPG, or WebP.',
    category: 'Image',
    icon: ImageCropIcon,
    accent: 'cyan',
    featured: true,
  },
  {
    slug: 'image-metadata-remove',
    href: '/tools/image-metadata-remove',
    title: 'Image Metadata Remover',
    shortLabel: 'Remove Metadata',
    description: 'Re-encode images to scrub common embedded metadata locally.',
    category: 'Image',
    icon: Shield01Icon,
    accent: 'teal',
  },
  {
    slug: 'image-remove-bg',
    href: '/tools/image-remove-bg',
    title: 'Remove Background',
    shortLabel: 'Remove BG',
    description: 'Remove background from images. Full resolution output.',
    category: 'Image',
    icon: ColorsIcon,
    accent: 'indigo',
    featured: true,
  },
  {
    slug: 'pdf-merge',
    href: '/tools/pdf-merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file.',
    category: 'PDF',
    icon: Layers01Icon,
    accent: 'red',
    featured: true,
  },
  {
    slug: 'pdf-split',
    href: '/tools/pdf-split',
    title: 'Split PDF',
    description: 'Extract specific pages or separate range intervals into new PDFs.',
    category: 'PDF',
    icon: SplitIcon,
    accent: 'orange',
    featured: true,
  },
  {
    slug: 'pdf-compress',
    href: '/tools/pdf-compress',
    title: 'Compress PDF',
    description: 'Reduce PDF sizes with vector metadata purging or canvas rasterization.',
    category: 'PDF',
    icon: ArrowShrink01Icon,
    accent: 'amber',
  },
  {
    slug: 'pdf-rotate',
    href: '/tools/pdf-rotate',
    title: 'Rotate PDF',
    description: 'Rotate specific pages in your PDF files by 90-degree steps.',
    category: 'PDF',
    icon: RotateClockwiseIcon,
    accent: 'rose',
  },
  {
    slug: 'pdf-reorder',
    href: '/tools/pdf-reorder',
    title: 'PDF Page Reorder',
    shortLabel: 'Reorder PDF',
    description: 'Drag pages into a new sequence and export a reordered PDF.',
    category: 'PDF',
    icon: ArrangeIcon,
    accent: 'red',
  },
  {
    slug: 'pdf-metadata-remove',
    href: '/tools/pdf-metadata-remove',
    title: 'PDF Metadata Remover',
    shortLabel: 'Remove Metadata',
    description: 'Clear common PDF info fields and save a privacy-scrubbed copy.',
    category: 'PDF',
    icon: Shield01Icon,
    accent: 'slate',
  },
  {
    slug: 'pdf-to-image',
    href: '/tools/pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert PDF pages into PNG or JPEG images locally.',
    category: 'PDF',
    icon: Image01Icon,
    accent: 'sky',
  },
  {
    slug: 'image-to-pdf',
    href: '/tools/image-to-pdf',
    title: 'Image to PDF',
    description: 'Compile multiple images (PNG, JPEG, WebP, GIF, TIFF, BMP) into a single PDF document.',
    category: 'PDF',
    icon: File01Icon,
    accent: 'indigo',
  },
];

export const IMAGE_TOOLS = TOOLS.filter((tool) => tool.category === 'Image');
export const PDF_TOOLS = TOOLS.filter((tool) => tool.category === 'PDF');
export const FEATURED_TOOLS = TOOLS.filter((tool) => tool.featured);

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

/** Like `getTool`, but fails loudly so a mistyped slug is caught at module load. */
export function requireTool(slug: string): Tool {
  const tool = getTool(slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}
