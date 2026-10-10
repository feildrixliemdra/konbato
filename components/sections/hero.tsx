'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { EASE } from '@/lib/motion';
import { TOOLS } from '@/lib/tools';
import { HeroDrop } from '@/components/sections/hero-drop';

/*
 * The hero is the product, not a description of it.
 *
 * Earlier versions were a headline over a readout of a fictional file: a
 * claim dressed as evidence. The page's one raised surface is now a working
 * drop zone. Drop a file, it tells you what it is and which tools open it,
 * and the file follows you into the tool. The headline sits beside it in a
 * narrow measure, so the surface is what the eye lands on.
 *
 * This is also the only entrance animation on the page: the statement, then
 * the surface rising into place. Every other section is static.
 */
export function Hero() {
  return (
    <section className="atmosphere-hero relative overflow-hidden">
      <div className="container grid gap-12 pb-14 pt-12 md:pb-20 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-center lg:gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE.out }}
        >
          <h1 className="max-w-2xl text-[2.75rem] font-bold font-manrope leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
            Convert, shrink and sign files without uploading them.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground font-dm-sans">
            A HEIC that will not open. A PDF too big to email. A scan that
            needs a signature. Konbato does the work inside this tab and hands
            the file straight back.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button size="lg" variant="outline" className="h-12 px-6 text-base font-semibold" asChild>
              <Link href="/tools">Browse all {TOOLS.length} tools</Link>
            </Button>
            <p className="text-sm text-muted-foreground font-dm-sans">
              Free, no account, nothing to install.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE.out }}
        >
          <HeroDrop />
        </motion.div>
      </div>
    </section>
  );
}
