'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoonIcon, Sun01Icon } from '@hugeicons/core-free-icons';

const subscribe = () => () => {};

/**
 * The sun and moon are both round, so rotating them into each other reads as a
 * day/night swap. Framer Motion drives this with inline styles rather than CSS
 * transitions, because `disableTransitionOnChange` suppresses those during a
 * theme swap.
 *
 * Under reduced motion the rotation and scale are dropped but the cross-fade is
 * kept: the preference targets movement, not opacity changes.
 */
const MOTION = {
  full: {
    hidden: { opacity: 0, rotate: -90, scale: 0.4 },
    shown: { opacity: 1, rotate: 0, scale: 1 },
    leaving: { opacity: 0, rotate: 90, scale: 0.4 },
  },
  reduced: {
    hidden: { opacity: 0 },
    shown: { opacity: 1 },
    leaving: { opacity: 0 },
  },
} as const;

/**
 * Symmetric ease so the rotation stays visible through the whole swap. A
 * front-loaded ease-out (like the ones used for section reveals) finishes the
 * ~90° turn inside the first two frames, which reads as an instant snap.
 */
const TRANSITION = { duration: 0.35, ease: [0.4, 0, 0.2, 1] } as const;

/**
 * True only after hydration. next-themes cannot resolve the theme during SSR,
 * so this stops the first client render from disagreeing with the server HTML.
 */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const prefersReducedMotion = useReducedMotion();

  // Set in the click handler, never during render or in an effect (both of which
  // the lint rules reject for good reason). AnimatePresence treats the icon as a
  // new child whenever the theme flips, so without this the swap would also play
  // once on page load.
  //
  // Deliberately keyed to a click rather than to any theme change: under
  // `disableTransitionOnChange` the whole page hard-cuts on a theme swap, so an
  // OS-driven change (`enableSystem`) stays instant and consistent with that,
  // while the icon animates only to acknowledge a theme the visitor chose.
  const [hasInteracted, setHasInteracted] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const action = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  const variants = prefersReducedMotion ? MOTION.reduced : MOTION.full;

  const handleClick = () => {
    setHasInteracted(true);
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={action}
      title={action}
    >
      {/* The wrapper is animated rather than the SVG so it can be GPU accelerated. */}
      <span className="relative flex h-5 w-5 items-center justify-center">
        <AnimatePresence initial={false}>
          {mounted && (
            <motion.span
              key={isDark ? 'sun' : 'moon'}
              className="absolute inset-0 flex items-center justify-center"
              initial={hasInteracted ? variants.hidden : false}
              animate={variants.shown}
              exit={variants.leaving}
              transition={TRANSITION}
            >
              <HugeiconsIcon
                icon={isDark ? Sun01Icon : MoonIcon}
                className="h-5 w-5"
                aria-hidden
              />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </Button>
  );
}
