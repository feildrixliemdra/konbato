'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Image01Icon,
  File01Icon,
  Search01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOLS, accentTile, type ToolCategory } from '@/lib/tools';

type CategoryFilter = 'All' | ToolCategory;

const categories: { name: CategoryFilter; icon: typeof Image01Icon | null }[] = [
  { name: 'All', icon: null },
  { name: 'Image', icon: Image01Icon },
  { name: 'PDF', icon: File01Icon },
];

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const matchesSearch =
        !query ||
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === 'All' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="container max-w-6xl py-8 md:py-12">
      {/* Page Hero */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl font-manrope">
          Client-Side Tools Directory
        </h1>
        <p className="mt-3 text-muted-foreground text-sm font-dm-sans leading-relaxed">
          All operations run strictly in your browser. Zero bytes uploaded to servers.
          Secure, fast, and completely free.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-8">
        {/* Category Tabs */}
        <div
          role="group"
          aria-label="Filter tools by category"
          className="flex gap-1.5 p-1 bg-muted/40 border border-border/40 rounded-xl max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.icon && (
                  <HugeiconsIcon icon={cat.icon} className="size-3.5" aria-hidden />
                )}
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
            <HugeiconsIcon icon={Search01Icon} className="size-4" aria-hidden />
          </span>
          <input
            type="search"
            aria-label="Search tools"
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
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.slug}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="group"
            >
              <Link
                href={tool.href}
                aria-label={`Open ${tool.title}`}
                className="block h-full"
              >
                <Card className="relative h-full overflow-hidden border border-border/60 bg-background/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 ${accentTile(tool.accent)}`}
                    >
                      <HugeiconsIcon icon={tool.icon} className="size-6" aria-hidden />
                    </div>
                  </div>

                  <h3 className="mb-2 text-lg font-bold font-manrope text-foreground transition-colors group-hover:text-primary">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed">
                    {tool.description}
                  </p>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary/80 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0">
                    Open Tool
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-3"
                      aria-hidden
                    />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredTools.length === 0 && (
        <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/5">
          <p className="text-muted-foreground font-dm-sans">
            No tools found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
