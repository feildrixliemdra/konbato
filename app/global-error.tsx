'use client';

/**
 * Replaces the root layout entirely, so Tailwind (loaded via the layout's CSS
 * import) may not be available here. Styles are inline on purpose so this page
 * still renders correctly when the CSS pipeline is the thing that broke.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#0f1115',
          color: '#f2f3f5',
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
          Konbato failed to load
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: '28rem',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: '#a8adb8',
          }}
        >
          A critical error stopped the application from rendering. Reloading usually
          fixes it.
        </p>
        {error.digest && (
          <p
            style={{
              margin: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.6875rem',
              color: '#6c727e',
            }}
          >
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: '#4b7bec',
            color: '#ffffff',
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
