'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-[color,background-color,box-shadow] [@media(pointer:coarse)]:py-3.5 ${
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
            className="w-full pl-9 pr-4 py-2 text-base sm:text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-[border-color,box-shadow] font-dm-sans [@media(pointer:coarse)]:min-h-11"
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
                <Card className="relative h-full overflow-hidden p-6 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-raised">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-[scale] duration-300 group-hover:scale-105 ${accentTile(tool.category)}`}
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

                  {/* Visible on touch, where there is no hover to reveal it. */}
                  <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary/80 transition-[opacity,translate] duration-300 [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100">
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

      {/* Empty state.
          Held back by the cards' exit duration: with mode="popLayout" the
          leaving cards stay painted at their old coordinates while they fade,
          so appearing immediately would overlap them. */}
      <AnimatePresence>
        {filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/5 py-24 text-center"
          >
            <p className="text-muted-foreground font-dm-sans">
              {searchQuery.trim() ? (
                <>
                  No tools match{' '}
                  <strong className="font-semibold text-foreground">
                    &ldquo;{searchQuery.trim()}&rdquo;
                  </strong>
                  .
                </>
              ) : (
                'No tools in this category.'
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="font-semibold font-manrope"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            >
              Show all {TOOLS.length} tools
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
