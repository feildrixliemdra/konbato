'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CodeIcon,
  Rocket01Icon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons';

const technologies = [
  {
    name: 'WebAssembly',
    color: 'from-blue-500 to-blue-600',
    description: 'Near-native performance',
    icon: Rocket01Icon,
  },
  {
    name: 'FFmpeg.wasm',
    color: 'from-purple-500 to-purple-600',
    description: 'Video processing power',
    icon: CodeIcon,
  },
  {
    name: 'Web Workers',
    color: 'from-green-500 to-green-600',
    description: 'Multi-threaded execution',
    icon: SecurityCheckIcon,
  },
  {
    name: 'Canvas API',
    color: 'from-orange-500 to-orange-600',
    description: 'Hardware acceleration',
    icon: Rocket01Icon,
  },
];

const codeSnippet = `// Process files locally
const convert = async (file) => {
  const worker = new Worker();
  const result = await worker
    .process(file);
  return result; // No upload!
};`;

export function PerformanceTech() {
  return (
    <section className="container py-24 md:py-32">
      <div className="relative rounded-3xl bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden border border-primary/10">
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
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
                <HugeiconsIcon icon={Rocket01Icon} className="h-3.5 w-3.5" />
                POWERED BY
              </div>

              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl font-manrope mb-6">
                Built for Performance
              </h2>

              <p className="text-lg text-muted-foreground font-dm-sans mb-10 leading-relaxed">
                Leveraging cutting-edge web technologies to deliver
                desktop-class performance directly in your browser. No servers,
                no delays.
              </p>

              {/* Tech Stack Grid */}
              <div className="grid grid-cols-2 gap-4">
                {technologies.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${tech.color} opacity-0 blur-xl transition-all group-hover:opacity-20`}
                    />
                    <div className="relative p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 group-hover:border-primary/30 transition-all">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tech.color} text-white flex-shrink-0`}
                        >
                          <HugeiconsIcon icon={tech.icon} className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm font-manrope mb-1">
                            {tech.name}
                          </h3>
                          <p className="text-xs text-muted-foreground font-dm-sans">
                            {tech.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Side - Code Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center"
          >
            <div className="relative w-full">
              {/* Code Window */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 overflow-hidden shadow-2xl">
                {/* Window Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-slate-400 font-dm-sans">
                      converter.js
                    </span>
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-6 font-mono text-sm">
                  <pre className="text-slate-300">
                    <code>
                      {codeSnippet.split('\n').map((line, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                        >
                          {line}
                        </motion.div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -bottom-4 -right-4 bg-background border border-primary/20 rounded-xl px-4 py-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold font-dm-sans">
                    100% Client-side
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Accent Orbs */}
        <div className="absolute top-20 right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      </div>
    </section>
  );
}
