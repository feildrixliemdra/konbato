'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick01Icon } from '@hugeicons/core-free-icons';
import { DURATION, EASE } from '@/lib/motion';

interface SuccessCardProps {
  title: string;
  description: string;
  children?: ReactNode;
  actions: ReactNode;
}

/**
 * The confirmation surface.
 *
 * This is the payoff of a task, so it gets a staged entrance rather than
 * appearing between frames: the tick lands first, the wording follows, then the
 * actions become available. The steps are short enough that a user who already
 * knows the result is not made to wait for the buttons.
 */
export function SuccessCard({
  title,
  description,
  children,
  actions,
}: SuccessCardProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <motion.div
        // A plain container fade, matching the list-result surfaces. The
        // character comes from the staged children below, so both result shapes
        // open with the same hand-off instead of two different rhythms.
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.quick, ease: EASE.out }}
        className="flex flex-col items-center gap-6 rounded-2xl bg-card p-8 shadow-raised"
      >
        <motion.div
          // Never scale from 0: an element that grows out of nothing reads as a
          // glitch. It arrives already most of the way there and settles.
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DURATION.confirm, ease: EASE.out }}
          className="inline-flex size-14 items-center justify-center rounded-2xl border border-success/20 bg-success/10 text-success"
        >
          <HugeiconsIcon icon={Tick01Icon} className="size-7" aria-hidden />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DURATION.confirm,
            ease: EASE.out,
            delay: 0.06,
          }}
          className="flex flex-col gap-2 text-center"
        >
          <h2 className="text-2xl font-bold font-manrope">{title}</h2>
          <p className="text-sm text-muted-foreground font-dm-sans">{description}</p>
        </motion.div>

        {children}

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DURATION.confirm,
            ease: EASE.out,
            delay: 0.12,
          }}
          className="mt-2 flex w-full flex-col gap-3 sm:flex-row"
        >
          {actions}
        </motion.div>
      </motion.div>
    </div>
  );
}
