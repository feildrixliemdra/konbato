'use client';

import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';
import { stagger } from '@/lib/motion';
import Link from 'next/link';
import { SECTION_KICKER } from '@/components/section-header';
import { requireTool } from '@/lib/tools';

/*
 * Who it is for.
 *
 * The heading is pinned to the left rail and the four jobs scroll past it. That
 * gives this section a shape nothing else on the page has: a standing label
 * with a list running beside it, rather than a header stacked over a grid. It
 * also means the section is still labelled after the reader has scrolled into
 * the middle of the rows.
 *
 * This used to be four gradient cards, each paying off with a usage count
 * (10K+ designers, 50K+ students) that nothing in the product corroborates. A
 * number is not evidence. The rows name the audience, name the job, and link to
 * the tool that does it.
 */
const audiences = [
  {
    who: 'Designers',
    job: 'Convert and optimize images for the web without visible quality loss.',
    tool: requireTool('image-convert'),
  },
  {
    who: 'Students',
    job: 'Merge and split lecture PDFs between classes without re-downloading them.',
    tool: requireTool('pdf-merge'),
  },
  {
    who: 'Office teams',
    job: 'Shrink a document until it clears an email attachment limit.',
    tool: requireTool('pdf-compress'),
  },
  {
    who: 'Confidential work',
    job: 'Scrub embedded metadata from a file before it leaves your hands.',
    tool: requireTool('image-metadata-remove'),
  },
];

export function UseCases() {
  return (
    <section className="container py-14 md:py-24">
      <div className="grid gap-10 border-t border-border pt-6 md:pt-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className={SECTION_KICKER}>Who it is for</p>
          <h2 className="mt-4 text-3xl font-bold font-manrope tracking-tight sm:text-4xl">
            Four jobs, one constraint
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground font-dm-sans">
            Every tool here runs under the same rule: the file is read, changed
            and written back on your machine. Who you are only changes which
            tool you reach for.
          </p>
        </div>

        <div className="flex flex-col">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.who}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: stagger(index, 0.08) }}
            >
              <Link
                href={audience.tool.href}
                className="group flex items-start justify-between gap-6 border-b border-border py-6 transition-colors first:border-t hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <div>
                  <h3 className="text-base font-bold font-manrope transition-colors group-hover:text-primary">
                    {audience.who}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground font-dm-sans">
                    {audience.job}
                  </p>
                </div>
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold font-manrope text-muted-foreground transition-colors group-hover:text-primary">
                  {audience.tool.shortLabel ?? audience.tool.title}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
