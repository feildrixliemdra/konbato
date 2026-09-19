'use client';

import { Card } from '@/components/ui/card';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FEATURED_TOOLS, ACCENTS, accentTile } from '@/lib/tools';

export function PopularTools() {
  return (
    <section className="relative overflow-hidden bg-muted/20 py-12 md:py-24">
      <div className="container relative z-10">
        <div className="mb-16 flex flex-col items-center text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl font-manrope"
          >
            Top Rated Tools
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 max-w-2xl text-lg text-muted-foreground font-dm-sans"
          >
            Our most used conversion and optimization tools, ready for your
            workflow.
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_TOOLS.map((tool, index) => {
            const accent = ACCENTS[tool.accent];
            return (
              <motion.div
                key={tool.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Link href={tool.href} className="group block h-full">
                  <Card className="relative h-full overflow-hidden border-border/60 bg-background/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl hover:shadow-primary/10">
                    {/* Gradient Border on Hover */}
                    <div
                      className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${accent.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10`}
                      style={{ padding: '1px' }}
                    >
                      <div className="h-full w-full rounded-[inherit] bg-background" />
                    </div>

                    <div className="flex items-start justify-between">
                      <div
                        className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-sm ${accentTile(tool.accent)}`}
                      >
                        <HugeiconsIcon
                          icon={tool.icon}
                          className="h-7 w-7"
                          aria-hidden
                        />
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 group-hover:border-primary/30 group-hover:text-primary">
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="h-4 w-4"
                          aria-hidden
                        />
                      </div>
                    </div>

                    <h3 className="mb-2 text-xl font-bold font-manrope text-foreground transition-colors group-hover:text-primary">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-dm-sans group-hover:text-foreground/80 transition-colors">
                      {tool.description}
                    </p>

                    {/* Bottom Accent Line */}
                    <div
                      className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${accent.gradient} transition-all duration-500 group-hover:w-full`}
                    />
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
    </section>
  );
}
