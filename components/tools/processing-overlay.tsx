'use client';

import { Card } from '@/components/ui/card';
import { ACCENTS, type AccentKey } from '@/lib/tools';
import { cn } from '@/lib/utils';

interface ProcessingOverlayProps {
  accent: AccentKey;
  message: string;
  progress: number;
}

export function ProcessingOverlay({
  accent,
  message,
  progress,
}: ProcessingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Card className="mx-4 flex w-full max-w-sm flex-col items-center gap-4 border-border/60 p-6 text-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"
          aria-hidden
        />
        <div className="flex w-full flex-col gap-1">
          <span className="text-sm font-semibold font-manrope">{message}</span>
          <span className="text-xs text-muted-foreground font-dm-sans">
            {Math.round(progress)}%
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Processing progress"
        >
          <div
            className={cn('h-full transition-all duration-300', ACCENTS[accent].bar)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>
    </div>
  );
}
