const formats = [
  {
    label: 'Image input',
    values: ['JPG', 'PNG', 'WEBP', 'GIF', 'TIFF'],
  },
  {
    label: 'Image output',
    values: ['JPG', 'PNG', 'WEBP'],
  },
  {
    label: 'Documents',
    values: ['PDF'],
  },
];

export function SupportedFormats() {
  return (
    <section className="container border-t py-10 md:py-16">
      <div className="flex flex-col items-center gap-6">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 font-manrope">
          Supported Formats
        </span>
        <div className="flex w-full flex-wrap justify-center gap-x-10 gap-y-4">
          {formats.map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground font-dm-sans">
                {group.label}:
              </span>
              {group.values.map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-md bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground font-dm-sans"
                >
                  {fmt}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
