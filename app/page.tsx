import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/sections/hero';
import { ToolCategories } from '@/components/sections/tool-categories';
import { PopularTools } from '@/components/sections/popular-tools';
import { HowItWorks } from '@/components/sections/how-it-works';
import { PrivacySecurity } from '@/components/sections/privacy-security';
import { PerformanceTech } from '@/components/sections/performance-tech';
import { SupportedFormats } from '@/components/sections/supported-formats';
import { UseCases } from '@/components/sections/use-cases';
import { FAQ } from '@/components/sections/faq';
import { CTABottom } from '@/components/sections/cta-bottom';

export default function Page() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-primary/20">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <PopularTools />
        <ToolCategories />
        <HowItWorks />
        <PrivacySecurity />
        <PerformanceTech />
        <UseCases />
        <SupportedFormats />
        <FAQ />
        <CTABottom />
      </main>
      <SiteFooter />
    </div>
  );
}
