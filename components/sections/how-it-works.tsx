'use client';

import { motion } from 'framer-motion';
import { stagger } from '@/lib/motion';
import { SectionHeader } from '@/components/section-header';

/*
 * Three steps.
 *
 * This was a three-across card grid, which made it the third card grid in a
 * row on a page that already had too many. The steps do not need containers:
 * they are a sequence, and a sequence reads better as a rail. Each numbered
 * node sits on the rule that runs out from it, the three rules line up into one
 * track, and the section is deliberately narrow and airy so it acts as a breath
 * between the dense registry above and the boxed privacy panel below.
 */
const steps = [
  {
    number: '01',
    title: 'Open a file',
    description:
      'Pick a file from your device, or drop it onto the workspace. It is read into memory in the tab.',
    detail: 'Batch selection and drag-and-drop are both supported.',
    metric: 'No upload',
  },
  {
    number: '02',
    title: 'Work on it',
    description:
      'The engines run in a worker, so the interface stays responsive while the file is rewritten.',
    detail: 'Conversion, compression, cropping, page edits, background removal.',
    metric: 'On-device',
  },
  {
    number: '03',
    title: 'Take it back',
    description:
      'Preview the result, then save it. The file is handed to your downloads folder and dropped from memory.',
    detail: 'Single files or a zip of the whole batch.',
    metric: 'Immediate',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container scroll-mt-20 py-10 md:py-16">
      {/* The wrapper is what narrows this section, not a `max-w-*` on the
          section itself: the `.container` utility sets its own `max-width` at
          each breakpoint, so a sibling `max-w-5xl` on the same element loses
          the cascade and the section stays full width. */}
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          variant="inline"
          kicker="How it works"
          title="Three steps, no round trip"
          lede="There is no upload step to wait on and no server to trust."
        />

        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: stagger(index, 0.1) }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs font-semibold text-foreground tabular-nums">
                  {step.number}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>

              <h3 className="mt-5 text-lg font-bold font-manrope">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-dm-sans">
                {step.description}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80 font-dm-sans">
                {step.detail}
              </p>
              <p className="mt-4 text-xs font-semibold font-manrope uppercase tracking-[0.14em] text-primary">
                {step.metric}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
