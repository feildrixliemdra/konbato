'use client';

import {
  CpuIcon,
  CloudDownloadIcon,
  CheckmarkBadge01Icon,
  Cancel01Icon,
  File01Icon,
  LockKeyIcon,
  Shield01Icon,
  FlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';
import { stagger } from '@/lib/motion';
import { SectionHeader } from '@/components/section-header';
import { DEMO_FILE } from '@/lib/demo-file';

const claims = [
  {
    title: 'No server uploads',
    description:
      'Your file is read into the tab and never posted anywhere. There is no endpoint in this codebase that accepts one.',
    icon: Shield01Icon,
  },
  {
    title: 'Nothing to breach',
    description:
      'A file that was never transmitted cannot be intercepted, subpoenaed, or left behind in a storage bucket.',
    icon: LockKeyIcon,
  },
  {
    title: 'No queue, no throttle',
    description:
      'Processing starts on the click. Your device is the entire capacity, so there is nothing to wait behind.',
    icon: FlashIcon,
  },
];

const guarantees = [
  { label: 'Client-side', value: '100%' },
  { label: 'File bytes sent', value: '0' },
  { label: 'Data retained', value: 'None' },
];

/**
 * The containment diagram.
 *
 * The section used to assert privacy three ways over a large shield icon. The
 * shield proved nothing. This draws the actual boundary instead: what happens
 * inside the tab, what crosses the network, and what specifically never does.
 * The one honest complication, that engine binaries and the ML model are
 * fetched like any website asset, is shown rather than hidden, because a claim
 * that survives its own exception is worth more than one that ignores it.
 */
function DataPath() {
  return (
    <div className="rounded-2xl border border-chamber-border bg-chamber-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-chamber-muted">
          Data path
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-chamber-success/10 px-2 py-1 text-xs font-semibold font-dm-sans text-chamber-success">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-3.5 w-3.5" aria-hidden />
          0 bytes of your file sent
        </span>
      </div>

      <div className="rounded-xl border border-chamber-accent/25 bg-chamber-accent/[0.06] p-4 sm:p-5">
        <span className="mb-3 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-chamber-accent">
          This device
        </span>

        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon icon={File01Icon} className="h-4 w-4 shrink-0 text-chamber-muted" aria-hidden />
            <span className="truncate text-sm font-semibold font-dm-sans text-chamber-foreground">
              {DEMO_FILE.source.name}
            </span>
          </span>
          <span className="shrink-0 text-sm text-chamber-muted font-dm-sans tabular-nums">
            {DEMO_FILE.source.size}
          </span>
        </div>

        <div className="my-3 flex items-center gap-2">
          <HugeiconsIcon icon={CpuIcon} className="h-4 w-4 shrink-0 text-chamber-accent" aria-hidden />
          <span className="text-xs text-chamber-muted font-dm-sans">
            re-encoded in the tab it was opened in
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon icon={File01Icon} className="h-4 w-4 shrink-0 text-chamber-muted" aria-hidden />
            <span className="truncate text-sm font-semibold font-dm-sans text-chamber-foreground">
              {DEMO_FILE.result.name}
            </span>
          </span>
          <span className="shrink-0 text-sm text-chamber-muted font-dm-sans tabular-nums">
            {DEMO_FILE.result.size}
          </span>
        </div>
      </div>

      {/* The boundary. The struck-through label is the whole section in one line. */}
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 border-t border-dashed border-chamber-border" />
        <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-chamber-muted">
          <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" aria-hidden />
          your file never crosses
        </span>
        <span className="h-px flex-1 border-t border-dashed border-chamber-border" />
      </div>

      <div className="rounded-xl border border-chamber-border bg-chamber-foreground/[0.03] p-4 sm:p-5">
        <span className="mb-3 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-chamber-muted">
          Outside
        </span>
        <div className="flex items-start gap-2.5">
          <HugeiconsIcon
            icon={CloudDownloadIcon}
            className="mt-0.5 h-4 w-4 shrink-0 text-chamber-muted"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-chamber-muted font-dm-sans">
            App code, engine binaries, and the background-removal model load
            like any other website asset, then cache. None of it is your file,
            and none of it carries one back.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-chamber-border pt-5">
        {guarantees.map((item) => (
          <div key={item.label}>
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-chamber-muted">
              {item.label}
            </dt>
            <dd className="mt-1.5 text-lg font-bold font-manrope tabular-nums text-chamber-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/*
 * The chamber.
 *
 * Every other section on the page is a light surface separated by hairlines,
 * so before this pass they all carried the same visual weight and the scroll
 * had contrast only on paper. This section is the argument the whole product
 * stands on, so it gets the page's one heavy band: a full-bleed dark room
 * that stays dark in both appearances, because "inside the tab" is dark
 * regardless of the theme outside. The diagram of the boundary is drawn on
 * the same dark, so the reader is standing inside the container while they
 * read where it ends.
 */
export function PrivacySecurity() {
  return (
    <section className="bg-chamber text-chamber-foreground">
      <div className="container py-16 md:py-28">
        <SectionHeader
          tone="invert"
          kicker="Privacy first"
          title="Your files, your device"
          lede="Most converters ask you to hand the file over. Konbato brings the processing to you instead, which removes the risk rather than promising to manage it."
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <div className="flex flex-col">
            {claims.map((claim, index) => (
              <motion.div
                key={claim.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: stagger(index, 0.08) }}
                className="flex items-start gap-4 border-t border-chamber-border py-5 last:border-b"
              >
                <HugeiconsIcon
                  icon={claim.icon}
                  className="mt-0.5 h-5 w-5 shrink-0 text-chamber-accent"
                  aria-hidden
                />
                <div>
                  <h3 className="text-base font-bold font-manrope text-chamber-foreground">
                    {claim.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-chamber-muted font-dm-sans">
                    {claim.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <DataPath />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
