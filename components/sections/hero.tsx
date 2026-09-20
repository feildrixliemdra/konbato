'use client';

import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { EASE, stagger } from '@/lib/motion';
import { DEMO_FILE as receipt } from '@/lib/demo-file';
import { TOOLS, requireTool } from '@/lib/tools';
import Link from 'next/link';

/*
 * The hero is a statement over an instrument, not a split with a side card.
 *
 * It used to be the standard two-column SaaS composition: headline, lede,
 * ticks and two buttons on the left, a floating proof card with a halo on the
 * right. That skeleton is the single most generated shape on the web, and it
 * also demoted the one piece of evidence the page has to a decorative panel.
 *
 * Now the headline is set once, as large as the container allows, and the
 * proof stops being a card and becomes the floor of the hero: a full-width
 * conversion strip, divided into cells like a readout, showing the demo file
 * going in, the boundary it stays behind, and the figure it comes out with.
 * The three tick bullets are gone; the strip already says what they said.
 */
export function Hero() {
  return (
    <section className="atmosphere-hero relative overflow-hidden pt-16 md:pt-24">
      <div className="container">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE.out }}
          className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          {TOOLS.length} tools · No account · No upload step
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: stagger(1, 0.1), ease: EASE.out }}
          className="mt-6 max-w-6xl text-5xl font-bold font-manrope leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl"
        >
          Convert &amp; edit files securely in your browser
        </motion.h1>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: stagger(2, 0.1), ease: EASE.out }}
            className="max-w-xl text-lg leading-relaxed text-muted-foreground font-dm-sans"
          >
            Your file is decoded, processed and re-encoded on this device. No
            upload step exists, so there is nothing to leak.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: stagger(3, 0.1), ease: EASE.out }}
            className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Button size="lg" className="group h-14 px-8 text-base font-semibold" asChild>
              <Link href="/tools">
                Start converting
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </Button>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center gap-2 rounded-sm text-base font-semibold font-dm-sans text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              How it works
              <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>
        </div>

        {/* The conversion strip. One real job, laid out as a readout across
            the full width of the hero: what you drop, the boundary it stays
            behind, what you keep, and what it cost. */}
        <motion.dl
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: stagger(4, 0.1), ease: EASE.out }}
          className="relative mt-14 grid gap-y-8 border-t border-border py-8 md:mt-20 md:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:gap-x-6 md:py-10 lg:gap-x-10"
        >
          <span aria-hidden className="rule-brand absolute inset-x-0 -top-px h-px" />

          <div>
            <dt className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              You drop
            </dt>
            <dd className="mt-3 truncate text-base font-semibold font-dm-sans">
              {receipt.source.name}
            </dd>
            <dd className="mt-1 text-sm text-muted-foreground font-dm-sans tabular-nums">
              {receipt.source.format} · {receipt.source.size}
            </dd>
          </div>

          {/* The connector is a term and a definition like its neighbours, not
              a decorative spacer: it is the claim that the file was rewritten
              here rather than shipped somewhere. Only the arrows are hidden from
              assistive tech, so the sentence around them is still read. */}
          <div>
            <dt className="sr-only">Transform</dt>
            <dd className="flex items-center gap-3 text-muted-foreground md:flex-col md:gap-2">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="hidden h-5 w-5 md:block"
                aria-hidden
              />
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="h-5 w-5 md:hidden"
                aria-hidden
              />
              <span className="font-mono text-xs uppercase tracking-[0.14em] md:text-center">
                <span className="block">re-encoded</span>
                <span className="block">on this device</span>
              </span>
            </dd>
          </div>

          <div>
            <dt className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              You keep
            </dt>
            <dd className="mt-3 truncate text-base font-semibold font-dm-sans">
              {receipt.result.name}
            </dd>
            <dd className="mt-1 text-sm text-muted-foreground font-dm-sans tabular-nums">
              {receipt.result.format} · {receipt.result.size}
            </dd>
          </div>

          <div>
            <dt className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              The cost
            </dt>
            <dd className="mt-2 flex flex-col items-start gap-1 lg:flex-row lg:items-baseline lg:gap-3">
              <span className="text-4xl font-bold font-manrope tabular-nums text-success md:text-5xl">
                {receipt.reduction}
              </span>
              <span className="text-sm text-muted-foreground font-dm-sans">smaller</span>
            </dd>
            {/* The bar is data, not ornament: its width is the figure stated
                beside it, read from the same source. */}
            <dd
              className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border/70"
              role="img"
              aria-label={`File size reduced by ${receipt.reduction}`}
            >
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.8, ease: EASE.out }}
                style={{ width: `${receipt.reductionPercent}%` }}
                className="block h-full origin-left rounded-full bg-gradient-to-r from-category-image to-success"
              />
            </dd>
            <dd className="mt-3 text-xs text-muted-foreground font-dm-sans">
              {requireTool(receipt.tool).title} · 0 bytes uploaded
            </dd>
          </div>
        </motion.dl>
      </div>

      {/* Bottom padding lives on the section so the atmosphere fade has room
          to run out below the strip. */}
      <div className="pb-12 md:pb-20" />
    </section>
  );
}
