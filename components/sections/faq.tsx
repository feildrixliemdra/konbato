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
      'No. Files are processed entirely in your browser using WebAssembly. They never leave your device.',
  },
  {
    question: 'Is this tool free?',
    answer: 'Yes. Konbato is free to use, with no account and no hidden fees.',
  },
  {
    question: 'Is there a file size limit?',
    answer:
      'Because processing happens on your device, the practical limit depends on your browser and available memory. Most files under a few hundred megabytes process comfortably. Very large files may be slow or run out of memory, so you get a warning before starting when a file looks risky for your device.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'Not yet. The page needs to load once over the network, after which your files never leave the device. Full offline support is planned.',
  },
  {
    question: 'Is it safe for confidential documents?',
    answer:
      'Yes. Because no file is uploaded, your confidential data stays on your machine.',
  },
];

/*
 * The format matrix is reference material, so it sits inside the reference
 * section, under the questions it belongs beside.
 */
const formats = [
  { label: 'Image input', values: 'JPG, PNG, WebP, GIF, TIFF and BMP. HEIC through Image Converter.' },
  { label: 'Image output', values: 'JPG, PNG and WebP' },
  { label: 'Documents', values: 'PDF in; PDF, Word, Markdown, PNG and JPG out' },
];

export function FAQ() {
  return (
    <section className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          variant="stack"
          title="Before you trust it with a real file"
          lede="The things people ask first."
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
        <h3 className="text-sm font-bold font-manrope">Supported formats</h3>
        <dl className="mt-5 grid gap-6 sm:grid-cols-3">
          {formats.map((group) => (
            <div key={group.label}>
              <dt className="text-sm font-semibold font-dm-sans">{group.label}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground font-dm-sans">
                {group.values}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
