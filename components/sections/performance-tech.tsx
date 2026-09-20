'use client';

import { motion } from 'framer-motion';
import { stagger } from '@/lib/motion';
import { SectionHeader } from '@/components/section-header';
import { ENGINES, type ExecutionLane } from '@/lib/engines';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CpuIcon,
  Download01Icon,
  Route01Icon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';

/*
 * The job lifecycle.
 *
 * Four stages in the order they happen when a tool runs, each tagged with the
 * same lane vocabulary the engine table uses. Three of the four are handoffs:
 * only `Process` moves off the thread that paints.
 */
const stages: {
  step: string;
  title: string;
  detail: string;
  lane: ExecutionLane;
  icon: typeof CpuIcon;
}[] = [
  {
    step: '01',
    title: 'Read',
    detail: 'The file you picked is read from disk into an ArrayBuffer.',
    lane: 'Main thread',
    icon: Upload01Icon,
  },
  {
    step: '02',
    title: 'Dispatch',
    detail: 'The buffer is copied into a module worker by structured clone.',
    lane: 'Main thread',
    icon: Route01Icon,
  },
  {
    step: '03',
    title: 'Process',
    detail: 'The engine rewrites the bytes, off the thread that paints.',
    lane: 'Worker',
    icon: CpuIcon,
  },
  {
    step: '04',
    title: 'Return',
    detail: 'The result comes back as a Blob and saves straight to your disk.',
    lane: 'Main thread',
    icon: Download01Icon,
  },
];

/** A lane chip. The label always states the lane, so colour is never the only cue. */
function LaneChip({ lane }: { lane: ExecutionLane }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold font-dm-sans ${
        lane === 'Worker' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}
    >
      {lane}
    </span>
  );
}

const HEAD =
  'border-b border-border px-5 py-4 text-start font-mono text-xs font-normal uppercase tracking-[0.14em] text-muted-foreground';

const CELL = 'block px-5 py-4 align-top sm:table-cell sm:py-5';

/** The table stacks below `sm`, so each cell carries its own column label. */
const CELL_LABEL =
  'block font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground sm:hidden';

export function PerformanceTech() {
  return (
    <section className="container py-12 md:py-24">
      <SectionHeader
        variant="inline"
        kicker="Under the hood"
        title="Built for performance"
        lede="Two engines run in a worker, two run on the thread that paints. The table does not round that split off."
      />

      {/* One instrument, not two modules: the lifecycle strip runs along the
          top of the same panel the engine ledger sits in, so the "what happens"
          and the "what does it" read as a single spec sheet. */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-surface">
        <ol className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <motion.li
              key={stage.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: stagger(index, 0.07) }}
              className="flex flex-col bg-card p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                  {stage.step}
                </span>
                <HugeiconsIcon icon={stage.icon} className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <h3 className="text-sm font-bold font-manrope">{stage.title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground font-dm-sans">
                {stage.detail}
              </p>
              <span className="mt-4 self-start">
                <LaneChip lane={stage.lane} />
              </span>
            </motion.li>
          ))}
        </ol>

        <table className="w-full border-collapse border-t border-border text-sm">
          <caption className="sr-only">
            The engines Konbato runs, their runtime, the lane they execute on, and what each one
            contributes
          </caption>
          <thead className="hidden sm:table-header-group">
            <tr>
              {['Engine', 'Runtime', 'Runs on', 'Contributes'].map((heading) => (
                <th key={heading} scope="col" className={HEAD}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ENGINES.map((engine, index) => (
              <motion.tr
                key={engine.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: stagger(index, 0.06) }}
                className="block border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30 sm:table-row"
              >
                <th
                  scope="row"
                  className="block px-5 py-4 text-start font-mono text-sm font-semibold sm:table-cell sm:py-5 sm:align-top"
                >
                  {engine.name}
                </th>
                <td className={`${CELL} text-muted-foreground font-dm-sans`}>
                  <span className={CELL_LABEL}>Runtime</span>
                  {engine.runtime}
                </td>
                <td className={CELL}>
                  <span className={`${CELL_LABEL} mb-1`}>Runs on</span>
                  <LaneChip lane={engine.lane} />
                </td>
                <td className={`${CELL} text-muted-foreground font-dm-sans`}>
                  <span className={CELL_LABEL}>Contributes</span>
                  {engine.role}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground font-dm-sans">
        Two jobs still run on the main thread: page thumbnails through
        pdfjs-dist, and background removal. Everything else is dispatched to a
        worker, so the interface keeps painting while a 200-page document is
        being rewritten.
      </p>
    </section>
  );
}
