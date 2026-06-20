'use client';

const formats = {
  Images: ['JPG', 'PNG', 'WEBP', 'AVIF', 'GIF', 'TIFF'],
  Documents: ['PDF', 'TXT', 'MD'],
};

export function SupportedFormats() {
  return (
    <section className="container py-10 md:py-16 border-t whitespace-nowrap overflow-hidden">
      <div className="flex w-full justify-center gap-12 text-sm font-medium text-muted-foreground">
        <div className="flex gap-4 items-center">
          <span className="text-foreground">Supported Formats:</span>
        </div>
        {Object.entries(formats).map(([key, list]) => (
          <div key={key} className="hidden md:flex gap-2 items-center">
            <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">
              {key}
            </span>
            {list.map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-1 rounded-md bg-muted/50 text-xs"
              >
                {fmt}
              </span>
            ))}
          </div>
        ))}
        {/* Simple marquee effect or just static list depending on width */}
        <div className="md:hidden text-xs">JPG, PNG, WEBP, TIFF, and PDF</div>
      </div>
    </section>
  );
}
