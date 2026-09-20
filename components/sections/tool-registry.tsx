'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { stagger } from '@/lib/motion';
import { SectionHeader } from '@/components/section-header';
import {
  ACCENTS,
  IMAGE_TOOLS,
  PDF_TOOLS,
  TOOLS,
  accentTile,
  type Tool,
  type ToolCategory,
} from '@/lib/tools';

/*
 * The registry.
 *
 * This replaces two sections that sat back to back and listed every tool
 * twice: a "top rated" card grid carrying a handful of them, then a category
 * grid carrying all of them. Two card grids of equal weight also said nothing
 * about which tool mattered, because every card was the same size.
 *
 * A registry is the honest shape for a directory. One dense scan, grouped by
 * the category axis the directory itself filters on, with the popular entries
 * hoisted to the top of their group and tagged. It is also the only section on
 * the page built this way, which is what gives the page its rhythm.
 */

/** Featured first inside a group, so the tag has something to mean. */
function byProminence(a: Tool, b: Tool): number {
  return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
}

const groups: { category: ToolCategory; label: string; note: string; tools: Tool[] }[] = [
  {
    category: 'Image',
    label: 'Image',
    note: 'Read and rewrite pixels.',
    tools: [...IMAGE_TOOLS].sort(byProminence),
  },
  {
    category: 'PDF',
    label: 'PDF',
    note: 'Read and rewrite pages.',
    tools: [...PDF_TOOLS].sort(byProminence),
  },
];

function RegistryRow({ tool, index }: { tool: Tool; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: stagger(index, 0.03) }}
    >
      <Link
        href={tool.href}
        className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-border/50 py-4 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:grid-cols-[auto_minmax(0,14rem)_minmax(0,1fr)_auto] md:gap-x-6 md:py-3.5"
      >
        <span
          className={`col-start-1 row-span-2 flex h-10 w-10 items-center justify-center rounded-xl md:row-span-1 ${accentTile(tool.category)}`}
        >
          <HugeiconsIcon icon={tool.icon} className="h-5 w-5" aria-hidden />
        </span>

        <span className="col-start-2 flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold font-manrope transition-colors group-hover:text-primary">
            {tool.title}
          </span>
          {tool.featured ? (
            <span className="shrink-0 rounded border border-border px-1.5 text-xs text-muted-foreground font-dm-sans">
              popular
            </span>
          ) : null}
        </span>

        <p className="col-start-2 min-w-0 text-xs leading-relaxed text-muted-foreground font-dm-sans md:col-start-3 md:text-sm">
          {tool.description}
        </p>

        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="col-start-3 row-span-2 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:row-span-1"
          aria-hidden
        />
      </Link>
    </motion.li>
  );
}

export function ToolRegistry() {
  return (
    <section id="tools" className="container py-14 md:py-28">
      <SectionHeader
        kicker="Registry"
        title={`${TOOLS.length} tools, two categories`}
        lede="Everything Konbato can do. Each entry opens straight into the workspace, with no sign-in and no upload step. Popular entries are marked and listed first."
      />

      <div className="flex flex-col gap-12">
        {groups.map((group) => (
          <div key={group.category}>
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
              <h3 className="flex items-center gap-2.5 text-xs font-semibold font-manrope uppercase tracking-[0.18em]">
                {/* Category is the one axis where hue carries information, and
                    it is always paired with this label. */}
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${ACCENTS[group.category].bar}`}
                  aria-hidden
                />
                {group.label}
                <span className="font-normal normal-case tracking-normal text-muted-foreground font-dm-sans">
                  {group.note}
                </span>
              </h3>
              <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                {group.tools.length} tools
              </span>
            </div>

            <ul className="flex flex-col">
              {group.tools.map((tool, index) => (
                <RegistryRow key={tool.slug} tool={tool} index={index} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
