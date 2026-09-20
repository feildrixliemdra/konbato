'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * An informational well inside a panel: what a mode will do, what was found,
 * what will be removed.
 *
 * These were previously `bg-muted/5` behind a full border. At 5% the tint sits
 * within a rounding error of the surface it is on, so the border was doing all
 * the work and the well itself was invisible. Borderless means the tint has to
 * carry it, which is what the full `bg-muted` role is for.
 */
export function NotePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl bg-muted p-5', className)}>{children}</div>
  );
}
