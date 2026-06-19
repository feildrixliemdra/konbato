'use client';

import { Card } from '@/components/ui/card';
import {
  Shield01Icon,
  LockKeyIcon,
  Rocket01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'No Server Uploads',
    description:
      'Your files never leave your device. All processing happens locally in your browser.',
    icon: Shield01Icon,
    highlight: 'Zero Upload',
  },
  {
    title: 'Private & Secure',
    description:
      "Since files aren't uploaded, there's zero risk of data breaches or unauthorized access.",
    icon: LockKeyIcon,
    highlight: '100% Private',
  },
  {
    title: 'Fast Processing',
    description:
      'Files are processed directly in your browser. No server queues or upload delays.',
    icon: Rocket01Icon,
    highlight: 'Fast Process',
  },
];

const trustBadges = [
  { label: '100% Client-Side', value: 'Processing' },
  { label: 'Zero Upload', value: 'Guarantee' },
  { label: 'GDPR', value: 'Compliant' },
];

export function PrivacySecurity() {
  return (
    <section className="container py-12 md:py-24">
      <div className="relative rounded-3xl bg-gradient-to-br from-primary/5 via-background to-green-500/5 overflow-hidden border border-primary/10">
        {/* Animated Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 p-8 md:p-12 lg:p-16">
          {/* Left Side - Content */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-1.5 text-xs font-semibold text-green-600 mb-6">
                <HugeiconsIcon icon={Shield01Icon} className="h-3.5 w-3.5" />
                PRIVACY FIRST
              </div>

              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl font-manrope mb-6">
                Your Files, Your Device
              </h2>

              <p className="text-lg text-muted-foreground font-dm-sans mb-10 leading-relaxed">
                Unlike traditional converters, we bring the processing power to
                you. No uploads, no servers, no compromises.
              </p>

              {/* Feature List */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-green-500/5 opacity-0 blur-xl transition-all group-hover:opacity-100" />
                      <div className="relative p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 group-hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-green-500/10 text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                            <HugeiconsIcon
                              icon={feature.icon}
                              className="h-6 w-6"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-base font-manrope">
                                {feature.title}
                              </h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold">
                                {feature.highlight}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-dm-sans">
                              {feature.description}
                            </p>
                          </div>
                          <HugeiconsIcon
                            icon={CheckmarkCircle01Icon}
                            className="h-5 w-5 text-green-500 flex-shrink-0"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Side - Shield Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-md">
              {/* Main Shield Container */}
              <div className="relative aspect-square">
                {/* Pulsing Background Rings */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-green-500/20 blur-2xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 to-primary/20 blur-3xl"
                />

                {/* Central Shield */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-green-500 blur-xl opacity-50" />
                    <div className="relative flex h-48 w-48 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-green-500/20 backdrop-blur-xl border-2 border-primary/30">
                      <HugeiconsIcon
                        icon={Shield01Icon}
                        className="h-24 w-24 text-primary"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Floating Particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, Math.sin(i) * 20, 0],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.3,
                    }}
                    className="absolute h-2 w-2 rounded-full bg-primary"
                    style={{
                      top: `${20 + i * 12}%`,
                      left: `${15 + (i % 2) * 70}%`,
                    }}
                  />
                ))}
              </div>

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {trustBadges.map((badge, index) => (
                  <motion.div
                    key={badge.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    className="text-center p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/60"
                  >
                    <div className="text-xs text-muted-foreground font-dm-sans uppercase tracking-wider mb-1">
                      {badge.label}
                    </div>
                    <div className="text-lg font-bold text-primary font-manrope">
                      {badge.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Accent Orbs */}
        <div className="absolute top-20 right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 left-20 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />
      </div>
    </section>
  );
}
