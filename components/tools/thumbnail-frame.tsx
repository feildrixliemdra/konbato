'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A small framed preview of a file inside a result row.
 *
 * Square by default because it sits beside a filename and a size pair, where a
 * tight square keeps the row height predictable. Pass a width/height or aspect
 * through `className` when the surrounding layout needs a different shape.
 *
 * The background is muted and the image covers, so a transparent PNG or a
 * page with a white margin does not look like a hole in the row.
 */
export function ThumbnailFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted',
        className
      )}
    >
      {children}
    </div>
  );
}
