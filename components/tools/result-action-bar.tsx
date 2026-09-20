'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { DURATION, EASE } from '@/lib/motion';

interface ResultActionBarProps {
  title: string;
  subtitle: string;
  onStartOver: () => void;
  onDownloadAll: () => void;
  downloadLabel: string;
  startOverLabel?: string;
}

/**
 * The result header for tools that return a list rather than one file.
 *
 * It mirrors SuccessCard's staging exactly, so a person who uses one tool and
 * then another gets the same hand-off from work to result instead of two
 * different rhythms depending on which shape the output happens to be.
 */
export function ResultActionBar({
  title,
  subtitle,
  onStartOver,
  onDownloadAll,
  downloadLabel,
  startOverLabel = 'Start Over',
}: ResultActionBarProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.confirm, ease: EASE.out }}
      >
        <h2 className="text-lg font-bold font-manrope">{title}</h2>
        <p className="text-xs text-muted-foreground font-dm-sans">{subtitle}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.confirm, ease: EASE.out, delay: 0.06 }}
        className="flex w-full justify-end gap-2 sm:w-auto sm:gap-3"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onStartOver}
          className="flex-1 text-xs font-semibold sm:flex-none"
        >
          {startOverLabel}
        </Button>
        <Button
          size="sm"
          onClick={onDownloadAll}
          className="flex-1 text-xs font-semibold sm:flex-none"
        >
          <HugeiconsIcon icon={Download01Icon} className="mr-1.5 size-3.5" aria-hidden />
          {downloadLabel}
        </Button>
      </motion.div>
    </div>
  );
}
