'use client';

import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function CTABottom() {
  return (
    <section className="border-t border-border py-20 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight font-manrope sm:text-5xl md:text-6xl">
            Ready to convert?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground font-dm-sans md:text-lg">
            Open a tool, drop a file in, and watch what happens when nothing has
            to leave your machine first.
          </p>
          <Button size="lg" className="group mt-10 h-14 px-8 text-base font-semibold" asChild>
            <Link href="/tools">
              Browse the tools
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Button>
          <p className="mt-7 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Free · No account · Nothing to install
          </p>
        </motion.div>
      </div>
    </section>
  );
}
