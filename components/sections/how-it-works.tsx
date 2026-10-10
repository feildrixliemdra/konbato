import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, Tick01Icon, Upload01Icon } from '@hugeicons/core-free-icons';
import { SectionHeader } from '@/components/section-header';
import { DEMO_FILE } from '@/lib/demo-file';
import { cn } from '@/lib/utils';

/*
 * Three steps.
 *
 * Each step is drawn as a miniature of the surface the product actually shows
 * at that moment: the drop zone, the processing card, the result card. The
 * same file travels through all three, so the sequence is read off the
 * pictures before the words. It is the one numbered thing on the page, because
 * it is the one piece of content that is a sequence, and the three rules the
 * numerals sit on line up into a single track: the round trip that never
 * leaves the device.
 *
 * The miniatures are illustrations and are hidden from assistive tech. Every
 * fact they carry is stated in the step copy or in the privacy diagram below.
 */

/** Where the bar sits in the middle miniature. Mid-job, not nearly done. */
const PROGRESS = 62;

const steps = [
  {
    title: 'Open a file',
    description:
      'Pick a file from your device, or drop it onto the workspace. It is read into memory in this tab and nowhere else.',
    detail: 'Several at once, or one at a time.',
  },
  {
    title: 'Work on it',
    description:
      'The engines run in a worker, so the page stays responsive while the file is rewritten.',
    detail: 'Convert, compress, crop, sign, split, remove a background.',
  },
  {
    title: 'Take it back',
    description:
      'Preview the result, then save it. The file lands in your downloads folder and is dropped from memory.',
    detail: 'One file, or a zip of the whole batch.',
  },
];

/** The shared frame: a small card at the resting elevation, like the real ones. */
function Mini({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex h-40 flex-col rounded-xl bg-card p-3 text-left shadow-surface select-none',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Step one: the drop zone with the demo file just landed in it. */
function MiniDrop() {
  return (
    <Mini>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold font-manrope">{DEMO_FILE.source.name}</span>
        <span className="text-[11px] text-muted-foreground font-dm-sans">
          {DEMO_FILE.source.size}
        </span>
      </div>
    </Mini>
  );
}

/** Step two: the processing card, mid-job. */
function MiniProcessing() {
  return (
    <Mini className="items-center justify-center gap-3 text-center">
      {/* A static arc, not a spinner: a perpetual animation on a page that is
          being read, not waited on, is noise. The arc still reads as "busy". */}
      <span
        className="h-7 w-7 rounded-full border-2 border-muted border-t-primary border-r-primary"
      />
      <div className="flex w-full flex-col gap-0.5">
        <span className="text-xs font-semibold font-manrope">Compressing</span>
        <span className="text-[11px] text-muted-foreground font-dm-sans tabular-nums">
          {PROGRESS}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-category-image"
          style={{ width: `${PROGRESS}%` }}
        />
      </div>
    </Mini>
  );
}

/** Step three: the result card with the file ready to save. */
function MiniResult() {
  return (
    <Mini className="items-center justify-center gap-2.5 text-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-success/20 bg-success/10 text-success">
        <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold font-manrope">{DEMO_FILE.result.name}</span>
        <span className="text-[11px] text-muted-foreground font-dm-sans tabular-nums">
          {DEMO_FILE.result.size}, {DEMO_FILE.reductionPercent}% smaller
        </span>
      </div>
      <span className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
        <HugeiconsIcon icon={Download01Icon} className="h-3 w-3" />
        Save
      </span>
    </Mini>
  );
}

const miniatures = [MiniDrop, MiniProcessing, MiniResult];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container scroll-mt-20 py-10 md:py-16">
      <div>
        <SectionHeader
          variant="inline"
          title="Three steps, no round trip"
          lede="There is no upload to wait on and no server to trust."
        />

        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {steps.map((step, index) => {
            const Miniature = miniatures[index];
            return (
              <li key={step.title}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold font-manrope tabular-nums text-primary">
                    {index + 1}
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>

                <div className="mt-5">
                  <Miniature />
                </div>

                <h3 className="mt-5 text-lg font-bold font-manrope">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-dm-sans">
                  {step.description}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground font-dm-sans">
                  {step.detail}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
