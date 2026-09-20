import { cn } from '@/lib/utils';

/**
 * The shared section opener.
 *
 * Every content section used to open the identical way: hairline, kicker, then
 * a two-column title and lede at the same spacing, eight times over. That
 * removed the centring it replaced and then created a worse problem, because a
 * page that opens every section the same way has no rhythm left to read.
 *
 * The variants keep the system (hairline, mono kicker, same type roles) and
 * change only the composition, so the sections still belong to one page while
 * the eye gets a different shape at each one:
 *
 * - `split`  title left, lede right. For a full-width band.
 * - `inline` kicker and title on one rail, lede trailing. For content that is
 *            already self-labelling and needs no separate title block.
 * - `stack`  everything stacked in a narrow measure. For an editorial column.
 *
 * `tone` swaps the role colours for a section that does not sit on the page
 * canvas. The privacy band is dark in both appearances, so its header cannot
 * read `border-border` or `text-muted-foreground`; before this prop the section
 * carried a hand-copied second version of the split layout, which would have
 * drifted the first time the spacing here changed.
 */
type SectionHeaderVariant = 'split' | 'inline' | 'stack';
type SectionHeaderTone = 'default' | 'invert';

/**
 * Exported so a section that lays its heading out by hand, like the split
 * one, still types its kicker identically to every section that uses the
 * component.
 */
export const SECTION_KICKER =
  'text-xs font-semibold font-manrope uppercase tracking-[0.18em] text-muted-foreground';

export function SectionHeader({
  kicker,
  title,
  lede,
  variant = 'split',
  tone = 'default',
  className,
}: {
  kicker: string;
  title: string;
  lede?: string;
  variant?: SectionHeaderVariant;
  tone?: SectionHeaderTone;
  className?: string;
}) {
  const inverted = tone === 'invert';
  const rule = inverted ? 'border-chamber-border' : 'border-border';
  const kickerClass = cn(SECTION_KICKER, inverted && 'text-chamber-muted');
  const titleClass = inverted ? 'text-chamber-foreground' : '';
  const ledeClass = inverted ? 'text-chamber-muted' : 'text-muted-foreground';

  if (variant === 'inline') {
    return (
      <div className={cn('mb-10 border-t pt-6 md:mb-14', rule, className)}>
        <div className="flex flex-col gap-x-10 gap-y-3 md:flex-row md:items-baseline md:justify-between">
          {/* One heading element, repositioned by the flex direction rather
              than duplicated: a `md:hidden` copy beside a `md:block` copy puts
              two identical headings in the outline and reads the title twice. */}
          <div className="flex flex-col gap-y-3 md:flex-row md:items-baseline md:gap-x-5">
            <p className={kickerClass}>{kicker}</p>
            <h2 className={cn('text-3xl font-bold font-manrope tracking-tight', titleClass)}>
              {title}
            </h2>
          </div>
          {lede ? (
            <p className={cn('max-w-md text-sm leading-relaxed font-dm-sans', ledeClass)}>
              {lede}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (variant === 'stack') {
    return (
      <div className={cn('mb-10 border-t pt-6 md:mb-14', rule, className)}>
        <p className={kickerClass}>{kicker}</p>
        <div className="mt-4 max-w-2xl">
          <h2
            className={cn(
              'text-3xl font-bold font-manrope tracking-tight sm:text-4xl',
              titleClass
            )}
          >
            {title}
          </h2>
          {lede ? (
            <p className={cn('mt-4 text-base leading-relaxed font-dm-sans', ledeClass)}>
              {lede}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mb-12 border-t pt-6 md:mb-16 md:pt-8', rule, className)}>
      <p className={kickerClass}>{kicker}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:items-baseline md:gap-16">
        <h2
          className={cn(
            'text-3xl font-bold font-manrope tracking-tight sm:text-4xl md:text-5xl',
            titleClass
          )}
        >
          {title}
        </h2>
        {lede ? (
          <p className={cn('text-base leading-relaxed font-dm-sans', ledeClass)}>{lede}</p>
        ) : null}
      </div>
    </div>
  );
}
