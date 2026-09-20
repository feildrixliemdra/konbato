'use client';

import { cn } from '@/lib/utils';

/**
 * A numeric or short-text field inside a panel.
 *
 * The load-bearing part of that class list is `text-base sm:text-xs`. iOS
 * Safari zooms the entire viewport when a focused input renders under 16px,
 * which throws the layout mid-task on exactly the screens where the work is
 * hardest. These fields had each been fixed by hand already and had drifted
 * apart on padding; keeping the fix in one place is what stops it being lost
 * again.
 *
 * Everything else passes through, so `id`, `aria-label`, and validation stay
 * at the call site where their meaning is.
 */
export function FieldInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-primary sm:text-xs [@media(pointer:coarse)]:min-h-11',
        className
      )}
      {...props}
    />
  );
}
