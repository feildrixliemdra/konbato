'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { IMAGE_TOOLS, PDF_TOOLS, ACCENTS, type Tool } from '@/lib/tools';

const categories: {
  title: string;
  items: Tool[];
  tile: string;
  description: string;
}[] = [
  {
    title: 'Image Tools',
    items: IMAGE_TOOLS,
    tile: 'bg-blue-500/10 text-blue-500',
    description: 'Convert, compress, crop, and clean up image files.',
  },
  {
    title: 'PDF Tools',
    items: PDF_TOOLS,
    tile: 'bg-red-500/10 text-red-500',
    description: 'Merge, split, rotate, and shrink PDF documents.',
  },
];

export function ToolCategories() {
  return (
    <section id="tools" className="container py-12 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-manrope">
          Everything You Need
        </h2>
        <p className="mt-4 text-lg text-muted-foreground font-dm-sans">
          Powerful tools for your everyday file tasks.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {categories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="group relative overflow-hidden p-6 transition-all hover:shadow-lg border-muted/60 bg-background/60 backdrop-blur-sm">
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${category.tile} transition-transform group-hover:scale-110`}
              >
                <HugeiconsIcon
                  icon={category.items[0].icon}
                  className="size-6"
                  aria-hidden
                />
              </div>
              <h3 className="mb-1 text-xl font-bold font-manrope">
                {category.title}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground font-dm-sans">
                {category.description}
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {category.items.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={tool.href}
                      className="group/item flex items-center justify-between gap-2 text-sm font-dm-sans transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                    >
                      <span className="flex items-center">
                        <span
                          className={`mr-2 h-1.5 w-1.5 rounded-full transition-colors ${ACCENTS[tool.accent].bar}`}
                        />
                        {tool.title}
                      </span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="size-3.5 opacity-0 transition-opacity group-hover/item:opacity-100"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
