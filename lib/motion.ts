/**
 * The motion system.
 *
 * Every animation in the app reads its duration and curve from here so the
 * interface moves with one voice. Values follow a deliberate budget: tactile
 * feedback lands instantly, small surfaces settle quickly, spatial changes get
 * enough time for the eye to track, and leaving is always faster than arriving.
 */

/** Durations in seconds, named for the job rather than the number. */
export const DURATION = {
  /** Press feedback. Must feel like the control heard the user. */
  press: 0.1,
  /** Hover, focus rings, and small state changes. The responsiveness baseline. */
  quick: 0.15,
  /** Confirmations and brief reveals. */
  confirm: 0.2,
  /** Menus, popovers, small dialogs. */
  menu: 0.25,
  /** Drawers, accordions, and layout reflow. */
  spatial: 0.3,
  /** Full-surface or page-level transitions. */
  surface: 0.4,
} as const;

/**
 * Decelerating curves only. Bounce and elastic read as toys, so nothing here
 * overshoots; motion settles rather than springs back.
 */
export const EASE = {
  /** Quart-out. Default for entrances: fast start, soft landing. */
  out: [0.22, 1, 0.36, 1],
  /** Symmetric ease. For cross-fades and icon swaps that have no direction. */
  inOut: [0.4, 0, 0.2, 1],
} as const;

/** The gap between siblings in a cascade. */
export const STAGGER_STEP = 0.08;

/** Peak deviation, in seconds, applied on top of the uniform step. */
const JITTER_SPREAD = 0.005;

/**
 * A deterministic offset in ±5ms derived from the item's index.
 *
 * A perfectly uniform `index * step` cascade reads as machine-generated: the
 * eye picks up the metronome. Real motion has a little variance. This uses a
 * pure function of the index rather than `Math.random()` so the server and the
 * client produce the same value and hydration stays clean.
 */
function jitter(index: number): number {
  const hashed = Math.sin(index * 12.9898 + 4.1414) * 43758.5453;
  const unit = hashed - Math.floor(hashed);
  return (unit * 2 - 1) * JITTER_SPREAD;
}

/**
 * Delay for the nth item in a cascade: `index * step`, plus a small
 * deterministic jitter so the sequence does not sound like a metronome.
 */
export function stagger(index: number, step: number = STAGGER_STEP): number {
  return index * step + jitter(index);
}

/**
 * A CSS `transition` value for exact properties.
 *
 * `transition: all` is refused throughout this codebase: it animates whatever
 * happens to change, including properties the browser cannot composite, and it
 * defeats the optimization the compositor would otherwise do. Every call site
 * names the properties it actually moves.
 */
export function transitionProperty(
  property: string,
  duration: keyof typeof DURATION = 'quick',
  ease: keyof typeof EASE = 'out'
): string {
  const curve = EASE[ease];
  return `${property} ${DURATION[duration]}s cubic-bezier(${curve.join(', ')})`;
}
