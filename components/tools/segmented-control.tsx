'use client';

import { cn } from '@/lib/utils';

interface SegmentedControlProps<T extends string> {
  /** Accessible name for the group, e.g. "Compression mode". */
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A pill-shaped either/or switch inside a panel (Text | Image, Light | Deep).
 *
 * This markup had been hand-copied into several tools, and each copy had to
 * receive the coarse-pointer touch fix separately. Buttons with `aria-pressed`
 * rather than radios, matching how the specs query them.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex gap-1.5 rounded-xl border border-border/40 bg-muted/40 p-1', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-xs font-semibold transition-[color,background-color,box-shadow] [@media(pointer:coarse)]:min-h-11',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
