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
  DashboardSquare01Icon,
} from '@hugeicons/core-free-icons';

export type ToolCategory = 'Image' | 'PDF';

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

/**
 * One accent per category, not per tool.
 *
 * These previously ran to eleven hues across thirteen tools. Because the
 * directory already filters on category, category is the only axis where a hue
 * tells the user something, so the palette now carries exactly that and nothing
 * more. The hues resolve to the `--category-*` tokens, which means they adapt
 * between light and dark mode instead of pinning a single Tailwind shade.
 */
export const ACCENTS: Record<ToolCategory, AccentClasses> = {
  Image: {
    tile: 'bg-category-image/10 text-category-image border-category-image/20',
    icon: 'text-category-image',
    bar: 'bg-category-image',
    button:
      'bg-category-image-strong hover:bg-category-image-strong/90 text-white shadow-lg shadow-category-image/20',
    gradient: 'from-category-image/50 to-category-image/50',
  },
  PDF: {
    tile: 'bg-category-doc/10 text-category-doc border-category-doc/20',
    icon: 'text-category-doc',
    bar: 'bg-category-doc',
    button:
      'bg-category-doc-strong hover:bg-category-doc-strong/90 text-white shadow-lg shadow-category-doc/20',
    gradient: 'from-category-doc/50 to-category-doc/50',
  },
};

/** Icon-tile classes including the 1px border width. */
export function accentTile(category: ToolCategory): string {
  return `border ${ACCENTS[category].tile}`;
}

export interface Tool {
  slug: string;
  href: string;
  title: string;
  shortLabel?: string;
  description: string;
  category: ToolCategory;
  icon: IconSvgElement;
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
    featured: true,
  },
  {
    slug: 'image-convert',
    href: '/tools/image-convert',
    title: 'Image Converter',
    description: 'Convert JPG, PNG, WEBP, GIF, and TIFF images instantly to other formats.',
    category: 'Image',
    icon: Image01Icon,
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
  },
  {
    slug: 'image-remove-bg',
    href: '/tools/image-remove-bg',
    title: 'Remove Background',
    shortLabel: 'Remove BG',
    description: 'Remove background from images. Full resolution output.',
    category: 'Image',
    icon: ColorsIcon,
    featured: true,
  },
  {
    slug: 'pdf-organizer',
    href: '/tools/pdf-organizer',
    title: 'PDF Organizer',
    description:
      'Combine PDFs, reorder pages, rotate, remove, and selectively export in one workspace.',
    category: 'PDF',
    icon: DashboardSquare01Icon,
    featured: true,
  },
  {
    slug: 'pdf-merge',
    href: '/tools/pdf-merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file.',
    category: 'PDF',
    icon: Layers01Icon,
    featured: true,
  },
  {
    slug: 'pdf-split',
    href: '/tools/pdf-split',
    title: 'Split PDF',
    description: 'Extract specific pages or separate range intervals into new PDFs.',
    category: 'PDF',
    icon: SplitIcon,
    featured: true,
  },
  {
    slug: 'pdf-compress',
    href: '/tools/pdf-compress',
    title: 'Compress PDF',
    description: 'Reduce PDF sizes with vector metadata purging or canvas rasterization.',
    category: 'PDF',
    icon: ArrowShrink01Icon,
  },
  {
    slug: 'pdf-rotate',
    href: '/tools/pdf-rotate',
    title: 'Rotate PDF',
    description: 'Rotate specific pages in your PDF files by 90-degree steps.',
    category: 'PDF',
    icon: RotateClockwiseIcon,
  },
  {
    slug: 'pdf-reorder',
    href: '/tools/pdf-reorder',
    title: 'PDF Page Reorder',
    shortLabel: 'Reorder PDF',
    description: 'Drag pages into a new sequence and export a reordered PDF.',
    category: 'PDF',
    icon: ArrangeIcon,
  },
  {
    slug: 'pdf-metadata-remove',
    href: '/tools/pdf-metadata-remove',
    title: 'PDF Metadata Remover',
    shortLabel: 'Remove Metadata',
    description: 'Clear common PDF info fields and save a privacy-scrubbed copy.',
    category: 'PDF',
    icon: Shield01Icon,
  },
  {
    slug: 'pdf-to-image',
    href: '/tools/pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert PDF pages into PNG or JPEG images locally.',
    category: 'PDF',
    icon: Image01Icon,
  },
  {
    slug: 'image-to-pdf',
    href: '/tools/image-to-pdf',
    title: 'Image to PDF',
    description: 'Compile multiple images (PNG, JPEG, WebP, GIF, TIFF, BMP) into a single PDF document.',
    category: 'PDF',
    icon: File01Icon,
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
