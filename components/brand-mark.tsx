import { cn } from '@/lib/utils';

/*
 * The Konbato mark: a K cut out of a rounded tile, its upper arm a page's
 * folded corner. Masters live in brand/. The K is a real hole (evenodd), so the
 * page shows through and the mark takes one colour — `currentColor`, which
 * lets `text-primary` follow the light/dark `--primary` token.
 */
const TILE =
  'M72,24 H184 A48,48 0 0 1 232,72 V184 A48,48 0 0 1 184,232 H72 A48,48 0 0 1 24,184 V72 A48,48 0 0 1 72,24 Z';
const K = 'M70,58 H106.5 V198 H70 Z M119,58 H186 L119,125 Z M119,141 L176,198 H119 Z';
// Below ~40px the standard gaps blur shut, so small sizes use a bigger K with wider gaps.
const K_SMALL = 'M60,50 H104 V206 H60 Z M122,50 H198 L122,126 Z M122,144 L184,206 H122 Z';

export function BrandMark({ small = false, className }: { small?: boolean; className?: string }) {
  return (
    <svg viewBox="24 24 208 208" className={cn('shrink-0', className)} aria-hidden focusable="false">
      <path fill="currentColor" fillRule="evenodd" d={`${TILE} ${small ? K_SMALL : K}`} />
    </svg>
  );
}
