'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeader } from '@/components/section-header';

const faqs = [
  {
    question: 'Are my files uploaded to your server?',
    answer:
      'No. Files are processed entirely in your browser using WebAssembly technology. They never leave your device.',
  },
  {
    question: 'Is this tool free?',
    answer: 'Yes, Konbato is currently 100% free to use with no hidden fees.',
  },
  {
    question: 'Is there a file size limit?',
    answer:
      'Because processing happens on your device, the practical limit depends on your browser and available memory (RAM). Most files under a few hundred megabytes process comfortably. Very large files may be slow or run out of memory, so we warn you before starting when a file looks risky for your device.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'Not yet. The page needs to load once over the network, after which your files never leave the device. Full offline support is planned.',
  },
  {
    question: 'Is it safe for confidential documents?',
    answer:
      'Absolutely. Because no file uploading occurs, your confidential data remains strictly on your machine.',
  },
];

/*
 * The format matrix.
 *
 * This was its own thin centred strip between the audience rows and the
 * questions. It did not carry enough weight to be a section, and centring it
 * made it the only centred block left on the page. It is reference material, so
 * it now sits inside the reference section, under the accordion it belongs
 * beside.
 */
const formats = [
  { label: 'Image input', values: ['JPG', 'PNG', 'WEBP', 'GIF', 'TIFF'] },
  { label: 'Image output', values: ['JPG', 'PNG', 'WEBP'] },
  { label: 'Documents', values: ['PDF'] },
];

export function FAQ() {
  return (
    <section className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          variant="stack"
          kicker="Questions"
          title="Frequently asked questions"
          lede="The things people ask before they trust a browser tool with a real file."
        />

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-manrope text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-dm-sans text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Reference band. Full width again, so the section steps from a narrow
          reading column out to a three-up matrix. */}
      <div className="mt-14 border-t border-border pt-8">
        <h3 className="text-xs font-semibold font-manrope uppercase tracking-[0.18em] text-muted-foreground">
          Supported formats
        </h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          {formats.map((group) => (
            <div key={group.label}>
              <p className="text-sm font-semibold font-dm-sans">{group.label}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.values.map((format) => (
                  <li
                    key={format}
                    className="rounded-md bg-muted/50 px-2 py-1 font-mono text-xs font-medium text-muted-foreground"
                  >
                    {format}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
