'use client';

import { motion } from 'framer-motion';
import {
  Upload01Icon,
  CpuIcon,
  Download01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const steps = [
  {
    number: '01',
    title: 'Upload',
    description: 'Select your files from your device. They stay local.',
    detail: 'Drag & drop or click to browse. Supports batch uploads.',
    icon: Upload01Icon,
    metric: 'Instant',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: '02',
    title: 'Process',
    description:
      'Files are converted instantly in your browser using WebAssembly.',
    detail: 'Powered by WebAssembly, Canvas, and Web Workers for maximum performance.',
    icon: CpuIcon,
    metric: '< 2 sec',
    color: 'from-primary to-purple-500',
    featured: true,
  },
  {
    number: '03',
    title: 'Download',
    description: 'Get your converted files immediately with zero wait time.',
    detail: 'Auto-download or preview before saving. Batch export supported.',
    icon: Download01Icon,
    metric: 'Instant',
    color: 'from-purple-500 to-pink-500',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container scroll-mt-20 py-12 md:py-24">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold font-manrope sm:text-5xl mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground font-dm-sans max-w-2xl mx-auto">
            Three simple steps to convert your files. Fast, secure, and
            completely client-side.
          </p>
        </motion.div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className={`group relative ${step.featured ? 'md:col-span-2 lg:col-span-1 lg:row-span-2' : ''}`}
          >
            <div className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-background/60 backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30">
              {/* Background Gradient */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)`,
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Step Number Badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-sm font-bold text-primary font-manrope mb-4">
                  {step.number}
                </div>

                {/* Icon with Animation */}
                <motion.div
                  animate={{
                    rotate: step.featured ? [0, 5, -5, 0] : 0,
                    scale: step.featured ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    duration: step.featured ? 4 : 0,
                    repeat: step.featured ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <HugeiconsIcon icon={step.icon} className="h-8 w-8" />
                </motion.div>

                {/* Title & Metric */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold font-manrope transition-colors group-hover:text-primary">
                    {step.title}
                  </h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-600 font-semibold border border-green-500/20">
                    {step.metric}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Detail (expandable feel) */}
                <div
                  className={`mt-auto pt-4 border-t border-border/40 ${step.featured ? 'block' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                >
                  <p className="text-xs text-muted-foreground/80 font-dm-sans italic">
                    {step.detail}
                  </p>
                </div>

                {/* Animated Progress Bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
                  className={`mt-4 h-1 rounded-full bg-gradient-to-r ${step.color} origin-left`}
                />
              </div>

              {/* Accent Orb */}
              <div
                className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
                }}
              />
            </div>

            {/* Connecting Arrow (desktop only) */}
            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 + 0.5 }}
                className="hidden lg:block absolute top-1/2 -right-3 z-20"
              >
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 border-2 border-background">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground font-dm-sans">
            <strong className="text-foreground font-semibold">100%</strong>{' '}
            Browser-Based
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm text-muted-foreground font-dm-sans">
            <strong className="text-foreground font-semibold">Zero</strong>{' '}
            Server Upload
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-sm text-muted-foreground font-dm-sans">
            <strong className="text-foreground font-semibold">Instant</strong>{' '}
            Results
          </span>
        </div>
      </motion.div>
    </section>
  );
}
