'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
      'Since processing happens on your device, the limit depends on your browser and available memory (RAM). Generally, files up to 2GB work fine.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'We are working on full offline support (PWA). Currently, you need an internet connection to load the page initially.',
  },
  {
    question: 'Is it safe for confidential documents?',
    answer:
      'Absolutely. Because no file uploading occurs, your confidential data remains strictly on your machine.',
  },
];

export function FAQ() {
  return (
    <section className="container max-w-3xl py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold font-outfit">
          Frequently Asked Questions
        </h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-outfit text-lg">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground font-jakarta text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
