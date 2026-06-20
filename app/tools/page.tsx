'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Image01Icon,
  File01Icon,
  RotateClockwiseIcon,
  SearchIcon,
  ArrowRight01Icon,
  Layers01Icon,
  SplitIcon,
  ArrowShrink01Icon,
  ColorsIcon,
  ImageCropIcon,
  Shield01Icon,
  ArrangeIcon,
} from '@hugeicons/core-free-icons';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
  // Image Category
  {
    title: 'Image Compress',
    description: 'Optimize image file size client-side without losing visual quality.',
    category: 'Image',
    icon: ArrowShrink01Icon,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    href: '/tools/image-compress',
    badge: 'Phase 1',
  },
  {
    title: 'Image Converter',
    description: 'Convert JPG, PNG, WEBP, GIF, and TIFF images instantly to other formats.',
    category: 'Image',
    icon: Image01Icon,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    href: '/tools/image-convert',
    badge: 'Phase 1',
  },
  {
    title: 'Image Resize & Crop',
    description: 'Crop by preset or numeric bounds, then resize into PNG, JPG, or WebP.',
    category: 'Image',
    icon: ImageCropIcon,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    href: '/tools/image-resize-crop',
    badge: 'Phase 1',
  },
  {
    title: 'Image Metadata Remover',
    description: 'Re-encode images to scrub common embedded metadata locally.',
    category: 'Image',
    icon: Shield01Icon,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    href: '/tools/image-metadata-remove',
    badge: 'Privacy',
  },
  {
    title: 'Remove Background',
    description: 'Remove background from images. Full resolution output.',
    category: 'Image',
    icon: ColorsIcon,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    href: '/tools/image-remove-bg',
    badge: 'Phase 1 - ML',
  },
  // PDF Category (Phase 2)
  {
    title: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file.',
    category: 'PDF',
    icon: Layers01Icon,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    href: '/tools/pdf-merge',
    badge: 'Phase 2',
  },
  {
    title: 'Split PDF',
    description: 'Extract specific pages or separate range intervals into new PDFs.',
    category: 'PDF',
    icon: SplitIcon,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    href: '/tools/pdf-split',
    badge: 'Phase 2',
  },
  {
    title: 'Compress PDF',
    description: 'Reduce PDF sizes with vector metadata purging or canvas rasterization.',
    category: 'PDF',
    icon: ArrowShrink01Icon,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    href: '/tools/pdf-compress',
    badge: 'Phase 2',
  },
  {
    title: 'Rotate PDF',
    description: 'Rotate specific pages in your PDF files by 90-degree steps.',
    category: 'PDF',
    icon: RotateClockwiseIcon,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    href: '/tools/pdf-rotate',
    badge: 'Phase 2',
  },
  {
    title: 'PDF Metadata Remover',
    description: 'Clear common PDF info fields and save a privacy-scrubbed copy.',
    category: 'PDF',
    icon: Shield01Icon,
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
    href: '/tools/pdf-metadata-remove',
    badge: 'Privacy',
  },
  {
    title: 'PDF Page Reorder',
    description: 'Drag pages into a new sequence and export a reordered PDF.',
    category: 'PDF',
    icon: ArrangeIcon,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    href: '/tools/pdf-reorder',
    badge: 'Phase 2',
  },
  {
    title: 'PDF to Image',
    description: 'Convert PDF pages into PNG or JPEG images locally.',
    category: 'PDF',
    icon: Image01Icon,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    href: '/tools/pdf-to-image',
    badge: 'Phase 2',
  },
  {
    title: 'Image to PDF',
    description: 'Compile multiple images (PNG/JPEG) into a single PDF document.',
    category: 'PDF',
    icon: File01Icon,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    href: '/tools/image-to-pdf',
    badge: 'Phase 2',
  },
];

const categories = [
  { name: 'All', icon: null },
  { name: 'Image', icon: Image01Icon },
  { name: 'PDF', icon: File01Icon },
];

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-primary/20 bg-background">
      <SiteHeader />
      
      <main className="flex-1 container py-8 md:py-12 max-w-6xl">
        {/* Page Hero */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl font-manrope">
            Client-Side Tools Directory
          </h1>
          <p className="mt-3 text-muted-foreground text-sm font-dm-sans leading-relaxed">
            All operations run strictly in your browser. Zero bytes uploaded to servers. Secure, fast, and completely free.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-8">
          {/* Category Tabs */}
          <div className="flex gap-1.5 p-1 bg-muted/40 border border-border/40 rounded-xl max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.icon && <HugeiconsIcon icon={cat.icon} className="size-3.5" />}
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
              <HugeiconsIcon icon={SearchIcon} className="size-4" />
            </span>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-dm-sans"
            />
          </div>
        </div>

        {/* Tools Grid */}
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <Link href={tool.href} aria-label={`Open ${tool.title}`} className="block h-full">
                    <Card className="relative h-full overflow-hidden border border-border/60 bg-background/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-border-hover hover:shadow-xl hover:shadow-primary/5">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${tool.bg} ${tool.color} transition-all duration-300 group-hover:scale-105`}
                        >
                          <HugeiconsIcon icon={Icon} className="size-6" />
                        </div>
                      </div>

                      <h3 className="mb-2 text-lg font-bold font-manrope text-foreground transition-colors group-hover:text-primary">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed">
                        {tool.description}
                      </p>

                      <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                        Open Tool
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredTools.length === 0 && (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/5">
            <p className="text-muted-foreground font-dm-sans">No tools found matching your criteria.</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
