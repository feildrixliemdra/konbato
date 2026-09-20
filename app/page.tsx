import { Hero } from '@/components/sections/hero';
import { ToolRegistry } from '@/components/sections/tool-registry';
import { HowItWorks } from '@/components/sections/how-it-works';
import { PrivacySecurity } from '@/components/sections/privacy-security';
import { PerformanceTech } from '@/components/sections/performance-tech';
import { UseCases } from '@/components/sections/use-cases';
import { FAQ } from '@/components/sections/faq';
import { CTABottom } from '@/components/sections/cta-bottom';

/*
 * Section order and density.
 *
 * The page used to be ten flat modules, each one a header stacked over a grid
 * of equal items, so nothing was louder or quieter than anything else and the
 * scroll had no rhythm. The order below alternates deliberately, and the
 * width, weight and density of each section is part of the composition:
 *
 *   hero        full-width statement over a conversion strip   loud
 *   registry    full width, dense rows                          loud
 *   how         narrow, airy rail                               quiet
 *   privacy     full-bleed dark chamber, the one heavy band     heavy
 *   performance full width, one merged spec panel               medium
 *   use cases   sticky rail, open rows                          medium
 *   faq         narrow column, then wide matrix                 quiet
 *   cta         centred terminal statement                      quiet
 *
 * The two tool sections were also merged. They sat back to back listing the
 * same thirteen tools, once as a card grid and again as a category grid.
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
