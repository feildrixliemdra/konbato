'use client';

import { Card } from '@/components/ui/card';
import {
  UserMultipleIcon,
  PencilEdit01Icon,
  BookOpen01Icon,
  SafeIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';

const useCases = [
  {
    title: 'For Designers',
    description: 'Convert & optimize images for web without quality loss.',
    icon: PencilEdit01Icon,
    metric: '10K+',
    metricLabel: 'Designers',
    // Deep Indigo → Slate Blue
    gradientFrom: 'oklch(0.45 0.18 270)',
    gradientTo: 'oklch(0.55 0.16 260)',
    iconBg: 'bg-[oklch(0.50_0.17_265/0.15)]',
    iconColor: 'text-[oklch(0.50_0.17_265)]',
    borderColor: 'border-[oklch(0.50_0.17_265/0.3)]',
  },
  {
    title: 'For Students',
    description: 'Split & merge lecture PDFs in seconds.',
    icon: BookOpen01Icon,
    metric: '50K+',
    metricLabel: 'Students',
    // Bright Blue → Sky Blue
    gradientFrom: 'oklch(0.60 0.20 240)',
    gradientTo: 'oklch(0.70 0.18 230)',
    iconBg: 'bg-[oklch(0.65_0.19_235/0.15)]',
    iconColor: 'text-[oklch(0.65_0.19_235)]',
    borderColor: 'border-[oklch(0.65_0.19_235/0.3)]',
  },
  {
    title: 'For Office',
    description: 'Compress documents for email attachments.',
    icon: UserMultipleIcon,
    metric: '5K+',
    metricLabel: 'Companies',
    // Warm Slate → Steel Blue
    gradientFrom: 'oklch(0.50 0.12 250)',
    gradientTo: 'oklch(0.58 0.14 245)',
    iconBg: 'bg-[oklch(0.54_0.13_247/0.15)]',
    iconColor: 'text-[oklch(0.54_0.13_247)]',
    borderColor: 'border-[oklch(0.54_0.13_247/0.3)]',
  },
  {
    title: 'For Privacy',
    description: 'Process sensitive files without uploading them.',
    icon: SafeIcon,
    metric: '100%',
    metricLabel: 'Private',
    // Teal → Cyan
    gradientFrom: 'oklch(0.55 0.16 200)',
    gradientTo: 'oklch(0.65 0.18 190)',
    iconBg: 'bg-[oklch(0.60_0.17_195/0.15)]',
    iconColor: 'text-[oklch(0.60_0.17_195)]',
    borderColor: 'border-[oklch(0.60_0.17_195/0.3)]',
    featured: true,
  },
];

export function UseCases() {
  return (
    <section className="container py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-bold font-manrope sm:text-5xl mb-4">
          Who is Konbato for?
        </h2>
        <p className="text-lg text-muted-foreground font-dm-sans max-w-2xl mx-auto">
          Trusted by professionals, students, and privacy-conscious users
          worldwide
        </p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {useCases.map((useCase, index) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card
              className="group relative h-full overflow-hidden border-border/60 backdrop-blur-xl bg-background/60 p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklch, ${useCase.gradientFrom}, transparent 92%) 0%, color-mix(in oklch, ${useCase.gradientTo}, transparent 94%) 100%)`,
              }}
            >
              {/* Glassmorphism border glow */}
              <div
                className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-20 -z-10"
                style={{
                  background: `linear-gradient(135deg, ${useCase.gradientFrom} 0%, ${useCase.gradientTo} 100%)`,
                  filter: 'blur(30px)',
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon with floating animation */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={`mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${useCase.iconBg} ${useCase.iconColor} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg border ${useCase.borderColor}`}
                >
                  <HugeiconsIcon icon={useCase.icon} className="h-8 w-8" />
                </motion.div>

                {/* Title */}
                <h3 className="mb-3 text-xl font-bold font-manrope transition-colors group-hover:text-primary">
                  {useCase.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground font-dm-sans leading-relaxed mb-6 group-hover:text-foreground/80 transition-colors flex-1">
                  {useCase.description}
                </p>

                {/* Metric */}
                <div className="mt-auto pt-4 border-t border-border/40">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold font-manrope ${useCase.iconColor}`}
                    >
                      {useCase.metric}
                    </span>
                    <span className="text-sm text-muted-foreground font-dm-sans">
                      {useCase.metricLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accent orb */}
              <div
                className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-15"
                style={{ background: useCase.gradientTo }}
              />
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
