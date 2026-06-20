'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon, Cancel01Icon } from '@hugeicons/core-free-icons';

interface DeviceWarningProps {
  fileSizeInBytes?: number;
  className?: string;
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

export function DeviceWarning({ fileSizeInBytes = 0, className = '' }: DeviceWarningProps) {
  const [dismissedSize, setDismissedSize] = useState<number | null>(null);
  const isVisible = dismissedSize !== fileSizeInBytes;
  let warning: string | null = null;

  if (typeof navigator !== 'undefined' && isVisible) {
    const ram = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
    const cores = navigator.hardwareConcurrency ?? 4;
    const isLowEnd = ram <= 2 || cores <= 2;
    const isMidEnd = ram <= 4 || cores <= 4;
    const fileSizeMB = fileSizeInBytes / (1024 * 1024);

    if (fileSizeMB > 500) {
      warning = `This file is very large (${fileSizeMB.toFixed(1)} MB). Processing files > 500 MB runs a high risk of crashing your browser tab. Consider processing in smaller chunks.`;
    } else if (isLowEnd && fileSizeMB > 50) {
      warning = `Your device has limited resources (${ram} GB RAM, ${cores} CPU cores). Processing this file (${fileSizeMB.toFixed(1)} MB) may be slow or cause the tab to freeze.`;
    } else if (isMidEnd && fileSizeMB > 150) {
      warning = `This file is large (${fileSizeMB.toFixed(1)} MB) relative to your device memory. The conversion might take some time to complete.`;
    }
  }

  if (!warning || !isVisible) return null;

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive-foreground transition-all animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive mt-0.5">
        <HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
      </div>
      <div className="flex-1 pr-6">
        <h5 className="font-semibold text-destructive mb-1 font-manrope">
          Device Performance Warning
        </h5>
        <p className="text-muted-foreground/90 font-dm-sans leading-relaxed text-xs">
          {warning}
        </p>
      </div>
      <button
        onClick={() => setDismissedSize(fileSizeInBytes)}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all"
        title="Dismiss warning"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
      </button>
    </div>
  );
}
