import { cn } from '@/lib/utils';

/**
 * The shared section opener.
 *
 * Three compositions on one system (hairline, title, lede in the same type
 * roles), so sections belong to one page while the eye meets a different
 * shape at each:
 *
 * - `split`  title left, lede right. For a full-width band.
 * - `inline` title and lede on one rail. For content that is already
 *            self-labelling and needs no separate title block.
 * - `stack`  everything stacked in a narrow measure. For an editorial column.
 *
 * There is no eyebrow label. An earlier pass put a tracked, upper-case kicker
 * above every title ("Registry", "Under the hood"), which labelled sections
 * that the title already named and was the most generated-looking thing on
 * the page. The title does that job alone now.
 */
type SectionHeaderVariant = 'split' | 'inline' | 'stack';

export function SectionHeader({
  title,
  lede,
  variant = 'split',
  className,
}: {
  title: string;
  lede?: string;
  variant?: SectionHeaderVariant;
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <div className={cn('mb-10 border-t border-border pt-6 md:mb-12', className)}>
        <div className="flex flex-col gap-x-10 gap-y-3 md:flex-row md:items-baseline md:justify-between">
          <h2 className="text-3xl font-bold font-manrope tracking-tight">{title}</h2>
          {lede ? (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground font-dm-sans">
              {lede}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (variant === 'stack') {
    return (
      <div className={cn('mb-10 border-t border-border pt-6 md:mb-12', className)}>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold font-manrope tracking-tight sm:text-4xl">{title}</h2>
          {lede ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground font-dm-sans">
              {lede}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mb-12 border-t border-border pt-6 md:mb-14 md:pt-8', className)}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:items-baseline md:gap-16">
        <h2 className="text-3xl font-bold font-manrope tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h2>
        {lede ? (
          <p className="text-base leading-relaxed text-muted-foreground font-dm-sans">{lede}</p>
        ) : null}
      </div>
    </div>
  );
}
