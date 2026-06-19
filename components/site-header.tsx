import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CommandIcon, MenuIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-8 flex items-center space-x-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
              <HugeiconsIcon icon={CommandIcon} className="h-5 w-5" />
            </div>
            <span className="hidden font-bold text-lg sm:inline-block font-manrope transition-colors group-hover:text-primary">
              Konbato
            </span>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium font-dm-sans">
            <Link
              href="/tools"
              className="relative transition-colors hover:text-foreground text-foreground/70 after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Tools
            </Link>
            <Link
              href="/docs"
              className="relative transition-colors hover:text-foreground text-foreground/70 after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Documentation
            </Link>
            <Link
              href="/pricing"
              className="relative transition-colors hover:text-foreground text-foreground/70 after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other items could go here */}
          </div>
          <nav className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="font-dm-sans font-medium border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all"
              asChild
            >
              <Link href="/tools">View All Tools</Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden hover:bg-primary/10 transition-colors"
            >
              <HugeiconsIcon icon={MenuIcon} className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
