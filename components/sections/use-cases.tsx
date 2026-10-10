import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { requireTool } from '@/lib/tools';

/*
 * The jobs people arrive with.
 *
 * This was a persona list: Designers, Students, Office teams, each with a
 * sentence about who they are. Nobody arrives at a file tool as a persona;
 * they arrive with a file and a problem. So each row is now the problem in
 * the words someone would say it, what the tool does about it, and the tool.
 * The first three are the same three the hero names, so the page keeps one
 * set of examples rather than inventing new ones per section.
 *
 * The heading is pinned to the left rail and the rows scroll past it, which
 * gives the section a shape nothing else on the page has.
 */
const jobs = [
  {
    problem: 'A HEIC that nothing else will open',
    how: 'Convert it to JPG, PNG or WebP. The photo keeps its full size.',
    tool: requireTool('image-convert'),
  },
  {
    problem: 'A PDF too big to email',
    how: 'Shrink it in place. Keep the text selectable, or rasterize every page for the smallest file.',
    tool: requireTool('pdf-compress'),
  },
  {
    problem: 'A scan that needs a signature',
    how: 'Draw or type one, place it on the page, save. The original bytes stay valid.',
    tool: requireTool('pdf-sign'),
  },
  {
    problem: 'A photo to share without its location in it',
    how: 'Camera, location and timestamp fields are rewritten out of the file.',
    tool: requireTool('image-metadata-remove'),
  },
];

export function UseCases() {
  return (
    <section className="container py-14 md:py-24">
      <div className="grid gap-10 border-t border-border pt-6 md:pt-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-3xl font-bold font-manrope tracking-tight sm:text-4xl">
            Four jobs, one rule
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground font-dm-sans">
            Whatever you arrive with, the file is read, changed and written
            back on your machine. The only thing that changes is which tool
            you open.
          </p>
        </div>

        <div className="flex flex-col">
          {jobs.map((job) => (
            <Link
              key={job.problem}
              href={job.tool.href}
              className="group flex items-start justify-between gap-6 border-b border-border py-6 transition-colors first:border-t hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <div>
                <h3 className="text-base font-bold font-manrope transition-colors group-hover:text-primary">
                  {job.problem}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground font-dm-sans">
                  {job.how}
                </p>
              </div>
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold font-manrope text-muted-foreground transition-colors group-hover:text-primary">
                {job.tool.shortLabel ?? job.tool.title}
                <HugeiconsIcon icon={ArrowRight01Icon} className="h-3 w-3" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
