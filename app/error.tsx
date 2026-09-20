'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon, Home01Icon, RefreshIcon } from '@hugeicons/core-free-icons';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive">
        <HugeiconsIcon icon={AlertCircleIcon} className="size-8" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-manrope">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground font-dm-sans">
          An unexpected error interrupted this page. Your files were never uploaded, so
          nothing left your device.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70 font-mono">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} className="font-semibold font-manrope">
          <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          Try Again
        </Button>
        <Button variant="outline" asChild className="font-semibold font-manrope">
          <Link href="/">
            <HugeiconsIcon icon={Home01Icon} className="size-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
