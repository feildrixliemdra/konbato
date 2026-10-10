import { SectionHeader } from '@/components/section-header';
import { ENGINES, type ExecutionLane } from '@/lib/engines';

/*
 * What does the work.
 *
 * One ledger of the engines, their runtime, the thread they run on and what
 * each one contributes. It used to sit under a four-stage lifecycle strip
 * that repeated the three steps above it in different words; the strip is
 * gone and the ledger carries the section on its own, because the ledger is
 * the part nobody else publishes.
 */

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
  'border-b border-border px-5 py-3.5 text-start text-xs font-semibold text-muted-foreground';

/*
 * Below `sm` the table stacks: each engine becomes its name, its lane chip and
 * what it contributes. The runtime column is hidden there, since it is the one
 * column a phone reader can do without, and labelling every stacked cell
 * doubled the height of the section.
 */
const CELL = 'block px-5 align-top sm:table-cell sm:py-5';

export function PerformanceTech() {
  return (
    <section className="container py-12 md:py-20">
      <SectionHeader
        variant="inline"
        title="What does the work"
        lede="Four engines. Two run in a worker, two on the thread that paints."
      />

      <div className="overflow-hidden rounded-2xl bg-card shadow-surface">
        <table className="w-full border-collapse text-sm">
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
            {ENGINES.map((engine) => (
              <tr
                key={engine.name}
                className="block border-b border-border/60 last:border-0 sm:table-row"
              >
                <th
                  scope="row"
                  className="block px-5 pb-1.5 pt-4 text-start text-sm font-bold font-manrope sm:table-cell sm:py-5 sm:align-top"
                >
                  {engine.name}
                </th>
                <td className="hidden px-5 py-5 align-top text-muted-foreground font-dm-sans sm:table-cell">
                  {engine.runtime}
                </td>
                <td className={CELL}>
                  <LaneChip lane={engine.lane} />
                </td>
                <td className={`${CELL} pb-4 pt-2 text-muted-foreground font-dm-sans sm:pt-5`}>
                  {engine.role}
                </td>
              </tr>
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
