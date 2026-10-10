import Link from 'next/link';
import { HeroDrop } from '@/components/sections/hero-drop';
import { TOOLS } from '@/lib/tools';

/*
 * The close.
 *
 * A centred headline over a "browse the tools" button is the generic ending,
 * and it sends the reader to another index after they have just read one.
 * The thing a reader wants at the end of this page is the thing the hero
 * offered at the top, so the same drop surface is here, where the file in
 * their head can go straight in.
 */
export function CTABottom() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight font-manrope sm:text-5xl">
            Try it on a real file
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground font-dm-sans md:text-lg">
            Drop one in and watch the network tab stay empty.
          </p>
        </div>
        <HeroDrop className="mx-auto mt-10 max-w-2xl" />
        <p className="mt-8 text-center text-sm text-muted-foreground font-dm-sans">
          Or{' '}
          <Link
            href="/tools"
            className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            browse all {TOOLS.length} tools
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
