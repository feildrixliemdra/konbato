/**
 * The file the marketing page demonstrates with.
 *
 * The hero receipt and the privacy diagram show the same job on purpose: the
 * reader meets this file at the top of the page, then meets it again inside the
 * containment boundary, which is what makes the privacy claim concrete instead
 * of merely repeating it. Single-sourced so the two cannot drift apart.
 *
 * The numbers are internally consistent: 610 KB of 4.2 MB is an 85.5% cut.
 *
 * `reduction` is the label and `reductionPercent` is the same figure as a
 * number, because the hero's bar has to be sized from the data. Deriving the
 * width from the label would mean parsing a formatted string, and hardcoding
 * `85%` in the markup would let the bar and the figure disagree the first time
 * this file changes.
 */
export const DEMO_FILE = {
  tool: 'image-compress',
  source: {
    name: 'IMG_2481.heic',
    format: 'HEIC · 4032 × 3024',
    size: '4.2 MB',
  },
  result: {
    name: 'IMG_2481.webp',
    format: 'WebP · 4032 × 3024',
    size: '610 KB',
  },
  reduction: '−85%',
  reductionPercent: 85,
} as const;
