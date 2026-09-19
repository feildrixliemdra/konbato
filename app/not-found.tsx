import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { FileNotFoundIcon, Home01Icon, LayoutGridIcon } from '@hugeicons/core-free-icons';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground">
        <HugeiconsIcon icon={FileNotFoundIcon} className="size-8" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-manrope">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground font-dm-sans">
          The page you are looking for does not exist. It may have been moved, or the
          link might be incorrect.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="font-semibold font-manrope">
          <Link href="/">
            <HugeiconsIcon icon={Home01Icon} className="size-4" />
            Back to Home
          </Link>
        </Button>
        <Button variant="outline" asChild className="font-semibold font-manrope">
          <Link href="/tools">
            <HugeiconsIcon icon={LayoutGridIcon} className="size-4" />
            Browse Tools
          </Link>
        </Button>
      </div>
    </div>
  );
}
