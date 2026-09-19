'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export type ProgressReporter = (progress: number, message?: string) => void;

interface TaskOptions {
  /** Message shown in the processing overlay while the task runs. */
  initialMessage?: string;
  /** User-facing copy used for both the toast and the inline error banner. */
  errorMessage?: string;
}

/**
 * Discriminated so success must be checked explicitly. A plain `T | null`
 * return would silently drop a legitimately falsy result (`0`, `''`, `false`).
 */
export type TaskOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Standardizes per-tool task state so failures always surface to the user.
 * The processing overlay unmounts as soon as a task settles, so errors are
 * surfaced through a toast plus a persistent inline banner instead.
 *
 * Tools do their work through their own `useWorker`/`postTask` handle; this
 * hook owns only the progress, error and completion state around that work.
 */
export function useToolTask() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setMessage('');
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const fail = useCallback((err: unknown, fallback: string): TaskOutcome<never> => {
    const detail = err instanceof Error ? err.message : undefined;
    console.error(err);
    setError(fallback);
    setIsProcessing(false);
    toast.error(fallback, {
      description: detail && detail !== fallback ? detail : undefined,
    });
    return { ok: false, error: fallback };
  }, []);

  const runTask = useCallback(
    async <T,>(
      task: (report: ProgressReporter) => Promise<T>,
      options: TaskOptions = {}
    ): Promise<TaskOutcome<T>> => {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setMessage(options.initialMessage ?? '');

      const report: ProgressReporter = (value, nextMessage) => {
        setProgress(value);
        if (nextMessage) setMessage(nextMessage);
      };

      try {
        const value = await task(report);
        setProgress(100);
        setIsProcessing(false);
        return { ok: true, value };
      } catch (err) {
        return fail(err, options.errorMessage ?? 'Processing failed.');
      }
    },
    [fail]
  );

  return { isProcessing, progress, message, error, clearError, reset, runTask };
}
