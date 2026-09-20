'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ACCENTS, type ToolCategory } from '@/lib/tools';
import { cn } from '@/lib/utils';

interface ToolPanelProps {
  /**
   * Panel heading. Optional because a couple of panels lead with their own
   * content (a file summary, for instance) rather than a title.
   */
  title?: string;
  /**
   * Sticks the panel below the header once the layout becomes multi-column.
   * Applied from `md` up, which is where these panels become a sidebar: below
   * that they stack, and a sticky panel in a single column just detaches from
   * the content it belongs to.
   */
  sticky?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * The settings and summary panel.
 *
 * Every tool page pairs its workspace with one of these, and before this they
 * were thirteen hand-rolled variants drifting apart: `gap-5` vs `gap-6`,
 * `p-5` vs `p-6`, `h2` vs `h3`, and three different sticky breakpoints. The
 * surface is borderless, so the card's own elevation carries the edge.
 *
 * The heading deliberately has no bottom rule. A rule under a title separates
 * nothing that spacing does not, and with the card outline gone an internal
 * line would become the loudest thing on the panel.
 */
export function ToolPanel({
  title,
  sticky = false,
  children,
  className,
}: ToolPanelProps) {
  return (
    // Composed from Card so there is one definition of the surface. `cn` is
    // twMerge-backed, so the padding here cleanly overrides Card's `py-4`.
    <Card
      className={cn(
        'gap-6 p-6',
        sticky && 'md:sticky md:top-6 md:self-start',
        className
      )}
    >
      {title && <h2 className="text-sm font-bold font-manrope">{title}</h2>}
      {children}
    </Card>
  );
}

/**
 * The action group at the foot of a panel.
 *
 * The rule here is kept: it delimits a different kind of content (the buttons
 * that commit the panel) from the settings above it, which is a real job. That
 * is why this one survives while the heading's underline did not.
 */
export function PanelActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-border/40 pt-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * The committing action of a panel.
 *
 * `w-full` suits the sidebar these live in, and the fill comes from the tool's
 * category so a panel never has to remember which accent it belongs to. The
 * same class string had been written out by hand twelve times.
 *
 * On a coarse pointer the button is lifted to the 44px touch floor. `min-h`
 * rather than `h` on purpose: min-height beats the size variant's height in the
 * box model whatever order the utilities land in, so this cannot be lost to the
 * cascade. Desktop keeps the compact 32px control, where a cursor is precise.
 */
export function PanelPrimaryAction({
  category,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { category: ToolCategory }) {
  return (
    <Button
      className={cn(
        'w-full font-semibold font-manrope [@media(pointer:coarse)]:min-h-11',
        ACCENTS[category].button,
        className
      )}
      {...props}
    />
  );
}

/**
 * The escape hatch beside it: change file, reset, cancel.
 *
 * Deliberately quieter than the primary, and always adjacent to it. Eight
 * copies of this class string existed, which is how a "secondary" action ends
 * up looking like six different things.
 */
export function PanelSecondaryAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full text-xs font-semibold text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:min-h-11',
        className
      )}
      {...props}
    />
  );
}
