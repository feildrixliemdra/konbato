'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="bottom-right"
      closeButton
      className="toaster group"
      /**
       * Clear of the home indicator and rounded corners on notched hardware.
       * The toast stack is the one fixed element anchored to a screen edge, so
       * it is the one that would otherwise sit under the inset.
       */
      mobileOffset={{
        bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        right: 'calc(env(safe-area-inset-right) + 16px)',
        left: 'calc(env(safe-area-inset-left) + 16px)',
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
