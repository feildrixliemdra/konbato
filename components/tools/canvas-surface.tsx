'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The dotted workspace where files are dropped and ordered.
 *
 * Three tools had each grown their own copy, differing only in padding and dot
 * pitch. The dot grid is the part that carries meaning: it reads as "this area
 * accepts things you arrange", which is why it is one grid everywhere.
 *
 * The dashed edge is kept. The borderless rule is about cards, which are
 * containers; a drop target's dashed outline is the conventional affordance
 * that says the area is interactive, and removing it would cost that signal.
 */
export function CanvasSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-[400px] rounded-2xl border border-dashed border-border/60 p-4 sm:p-6',
        'bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]',
        className
      )}
    >
      {children}
    </div>
  );
}
