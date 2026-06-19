'use client';

import { Card } from '@/components/ui/card';
import {
  Image01Icon,
  File01Icon,
  VideoReplayIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';

const categories = [
  {
    title: 'Image Tools',
    icon: <HugeiconsIcon icon={Image01Icon} />,
    items: ['JPG to PNG', 'PNG to WEBP', 'Compress Image'],
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'PDF Tools',
    icon: <HugeiconsIcon icon={File01Icon} />,
    items: ['Merge PDF', 'Split PDF', 'Compress PDF'],
    color: 'bg-red-500/10 text-red-500',
  },
  {
    title: 'Video Tools',
    icon: <HugeiconsIcon icon={VideoReplayIcon} />,
    items: ['Convert Video', 'Compress Video', 'Trim Video'],
    color: 'bg-purple-500/10 text-purple-500',
  },
];

export function ToolCategories() {
  return (
    <section id="tools" className="container py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-outfit">
          Everything You Need
        </h2>
        <p className="mt-4 text-lg text-muted-foreground font-jakarta">
          Powerful tools for your everyday file tasks.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {categories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="group relative overflow-hidden   p-6 transition-all hover:shadow-lg border-muted/60 bg-background/60 backdrop-blur-sm">
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${category.color} transition-transform group-hover:scale-110`}
              >
                {category.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold font-outfit">
                {category.title}
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center text-sm font-jakarta hover:text-foreground cursor-pointer transition-colors"
                  >
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    {item}
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
