'use client';

import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

export function CTABottom() {
  return (
    <section className="relative py-12 md:py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      {/* Geometric Accents */}
      <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl font-manrope">
            Ready to Convert?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground font-dm-sans max-w-2xl mx-auto leading-relaxed">
            Start converting files securely — no upload required.
          </p>
          <Button
            size="lg"
            className="group h-14 px-10 text-base font-semibold shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 hover:scale-105"
          >
            Get Started Now
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
            />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
