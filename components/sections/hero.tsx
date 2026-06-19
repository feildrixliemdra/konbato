'use client';

import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  Upload01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

const features = ['No server file uploads', 'Lightning fast', 'Privacy guaranteed'];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-36 md:pb-36">
      <div className="container relative z-10">
        <div className="mx-auto max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl font-manrope"
          >
            <span className="block bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Convert & Edit Files
            </span>
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Securely in Your Browser
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl font-dm-sans leading-relaxed"
          >
            Convert images, PDFs, and videos securely in your browser.
            Privacy-first, fast, and free. No server processing, no data leaks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 flex flex-wrap gap-4"
          >
            {features.map((feature, index) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm font-medium text-foreground/80"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <HugeiconsIcon icon={Tick02Icon} className="h-3 w-3" />
                </div>
                {feature}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="group h-14 px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
            >
              Start Converting
              <HugeiconsIcon
                icon={Upload01Icon}
                className="ml-2 h-5 w-5 transition-transform group-hover:translate-y-[-2px]"
              />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-semibold bg-background/50 backdrop-blur-sm border-border/60 hover:border-primary/30 hover:bg-background/80 transition-all"
              asChild
            >
              <Link href="#tools" className="group">
                View All Tools
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Background with Gradient Mesh */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Gradient Mesh */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
          style={{ background: 'var(--gradient-mesh)' }}
        />

        {/* Geometric Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Animated Accent Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 right-[10%] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-20 left-[15%] h-[350px] w-[350px] rounded-full bg-accent/20 blur-[100px]"
        />
      </div>
    </section>
  );
}
