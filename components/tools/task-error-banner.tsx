'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { DURATION, EASE } from '@/lib/motion';

interface TaskErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function TaskErrorBanner({
  message,
  onDismiss,
  className = '',
}: TaskErrorBannerProps) {
  if (!message) return null;

  return (
    <motion.div
      role="alert"
      // Brief and useful only. Error motion that performs draws attention to the
      // movement instead of the message, and a user already having a bad time
      // does not need theatre.
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.quick, ease: EASE.out }}
      className={`relative flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 ${className}`}
    >
      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <HugeiconsIcon icon={AlertCircleIcon} className="size-4" aria-hidden />
      </div>
      <div className="flex-1 pr-6 [@media(pointer:coarse)]:pr-12">
        <h3 className="mb-1 text-sm font-semibold font-manrope text-destructive">
          Processing failed
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground/60 transition-[color,background-color,transform] duration-150 ease-out hover:bg-destructive/10 hover:text-destructive active:scale-[0.94] [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" aria-hidden />
        </button>
      )}
    </motion.div>
  );
}
