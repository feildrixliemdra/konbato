'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Makes every Framer Motion animation in the app respect the visitor's
 * `prefers-reduced-motion` setting.
 *
 * `reducedMotion="user"` stops Framer Motion from animating transform and
 * layout, while still allowing opacity, so a slide-in becomes a plain fade.
 * Centralising it here means the ~70 `motion.*` call sites across the marketing
 * sections do not each have to read `useReducedMotion()` themselves.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
