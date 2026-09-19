'use client';

import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';

interface ResultActionBarProps {
  title: string;
  subtitle: string;
  onStartOver: () => void;
  onDownloadAll: () => void;
  downloadLabel: string;
  startOverLabel?: string;
}

export function ResultActionBar({
  title,
  subtitle,
  onStartOver,
  onDownloadAll,
  downloadLabel,
  startOverLabel = 'Start Over',
}: ResultActionBarProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-lg font-bold font-manrope">{title}</h2>
        <p className="text-xs text-muted-foreground font-dm-sans">{subtitle}</p>
      </div>
      <div className="flex w-full justify-end gap-2 sm:w-auto sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onStartOver}
          className="flex-1 text-xs font-semibold sm:flex-none"
        >
          {startOverLabel}
        </Button>
        <Button
          size="sm"
          onClick={onDownloadAll}
          className="flex-1 text-xs font-semibold sm:flex-none"
        >
          <HugeiconsIcon icon={Download01Icon} className="mr-1.5 size-3.5" aria-hidden />
          {downloadLabel}
        </Button>
      </div>
    </div>
  );
}
