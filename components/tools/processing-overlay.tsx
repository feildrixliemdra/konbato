'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ACCENTS, type ToolCategory } from '@/lib/tools';
import { DURATION, EASE } from '@/lib/motion';

interface ProcessingOverlayProps {
  category: ToolCategory;
  message: string;
  progress: number;
}

export function ProcessingOverlay({
  category,
  message,
  progress,
}: ProcessingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.quick, ease: EASE.out }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      {/* The overlay sits on the attention plane, so the panel arrives by
          settling into place rather than appearing between frames. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.quick, ease: EASE.out }}
        className="mx-4 w-full max-w-sm"
      >
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          {/* 800ms: fast enough to read as active, slow enough not to feel panicked. */}
          <div
            className="size-8 animate-spin rounded-full border-b-2 border-primary duration-[800ms]"
            aria-hidden
          />
          <div className="flex w-full flex-col gap-1">
            <span className="text-sm font-semibold font-manrope">{message}</span>
            <span className="text-xs text-muted-foreground font-dm-sans">
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Processing progress"
          >
            {/* scaleX rather than width: the compositor can run a transform on
                its own, while an animating width forces layout on every frame.
                The rounding comes from the parent's clip, so scaling the fill
                does not distort it. */}
            <div
              className={`h-full w-full origin-left transition-transform duration-300 ease-out ${ACCENTS[category].bar}`}
              style={{ transform: `scaleX(${Math.min(100, Math.max(0, progress)) / 100})` }}
            />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
