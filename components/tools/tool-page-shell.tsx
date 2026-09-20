'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { accentTile, type ToolCategory } from '@/lib/tools';
import { cn } from '@/lib/utils';

interface ToolPageShellProps {
  title: string;
  description: string;
  icon: IconSvgElement;
  category: ToolCategory;
  children: ReactNode;
  /** `wide` uses a 6xl container for thumbnail-heavy workspaces. */
  width?: 'default' | 'wide';
  className?: string;
}

export function ToolPageShell({
  title,
  description,
  icon,
  category,
  children,
  width = 'default',
  className,
}: ToolPageShellProps) {
  return (
    <div
      className={cn(
        'container py-8 md:py-12',
        width === 'wide' ? 'max-w-6xl' : 'max-w-5xl',
        className
      )}
    >
      <Link
        href="/tools"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground [@media(pointer:coarse)]:min-h-11"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" aria-hidden />
        Back to Tools
      </Link>

      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              accentTile(category)
            )}
          >
            <HugeiconsIcon icon={icon} className="size-5" aria-hidden />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-manrope">{title}</h1>
        </div>
        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground font-dm-sans">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}
