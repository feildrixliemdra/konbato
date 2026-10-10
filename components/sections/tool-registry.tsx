import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionHeader } from '@/components/section-header';
import { ACCENTS, TOOL_GROUPS, TOOLS, accentTile, type ToolGroup } from '@/lib/tools';
import { cn } from '@/lib/utils';

/*
 * The index.
 *
 * Twenty-two tools in one column was the longest and flattest stretch of the
 * page: a wall of identical rows that took three screens to scroll. The same
 * tools are now grouped by the job you came to do, in the task groups the
 * header menu already uses, and laid out in columns so the whole index fits
 * in about one screen on a laptop.
 *
 * CSS columns rather than a grid: the groups are different heights (three to
 * six tools), and a grid would leave holes where a short group sits beside a
 * tall one. Columns pack them top to bottom and `break-inside-avoid` keeps a
 * heading with its list.
 */
function groupTitle(group: ToolGroup): string {
  return group.category === 'PDF' ? `${group.label} PDFs` : group.label;
}

function Group({ group }: { group: ToolGroup }) {
  const headingId = `index-${group.id}`;
  return (
    <section aria-labelledby={headingId} className="mb-10 break-inside-avoid">
      <h3
        id={headingId}
        className="flex items-center gap-2 border-b border-border pb-3 text-sm font-bold font-manrope"
      >
        {/* Category is the one axis where hue carries information, and the
            dot is always paired with the written heading. */}
        <span
          className={cn('h-2 w-2 shrink-0 rounded-full', ACCENTS[group.category].bar)}
          aria-hidden
        />
        {groupTitle(group)}
      </h3>
      <ul className="mt-2 flex flex-col">
        {group.tools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={tool.href}
              className="group -mx-2 flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  accentTile(tool.category)
                )}
              >
                <HugeiconsIcon icon={tool.icon} className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold font-manrope transition-colors group-hover:text-primary">
                  {tool.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground font-dm-sans">
                  {tool.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ToolRegistry() {
  return (
    <section id="tools" className="container pb-16 pt-10 md:pb-24 md:pt-14">
      <SectionHeader
        title={`${TOOLS.length} tools, sorted by the job`}
        lede="Open any of them and the workspace is ready. Nothing to sign in to, nothing to install, and no upload step on the way in."
      />
      <div className="gap-x-10 sm:columns-2 lg:columns-3">
        {TOOL_GROUPS.map((group) => (
          <Group key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}
