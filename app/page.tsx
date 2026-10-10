import { Hero } from '@/components/sections/hero';
import { ToolRegistry } from '@/components/sections/tool-registry';
import { HowItWorks } from '@/components/sections/how-it-works';
import { PrivacySecurity } from '@/components/sections/privacy-security';
import { PerformanceTech } from '@/components/sections/performance-tech';
import { UseCases } from '@/components/sections/use-cases';
import { FAQ } from '@/components/sections/faq';
import { CTABottom } from '@/components/sections/cta-bottom';

/*
 * Section order and weight.
 *
 * One raised surface, one tinted band, everything else flat on the canvas. The
 * boldness is spent in the hero, where the drop zone is the product itself,
 * and the rest of the page is kept quiet so that surface stays the thing the
 * eye lands on:
 *
 *   hero        statement beside a working drop surface      raised
 *   index       every tool, grouped by job, in columns       flat, dense
 *   how         narrow, numbered rail                        flat, airy
 *   privacy     full-bleed tinted band, prose and a ledger   tinted
 *   engines     one ledger on a card                         flat
 *   use cases   sticky rail, open rows                       flat
 *   faq         narrow column, then a wide reference band    flat
 *   cta         centred closing statement                    flat
 *
 * There is no eyebrow label, no monospace label and no scroll-in cascade
 * anywhere on the page. The only motion is the hero's entrance and what
 * answers a pointer.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <ToolRegistry />
      <HowItWorks />
      <PrivacySecurity />
      <PerformanceTech />
      <UseCases />
      <FAQ />
      <CTABottom />
    </>
  );
}
