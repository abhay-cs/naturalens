export { Spacing, BorderRadii } from './tokens';

/**
 * How tall the floating tab bar pill is, excluding the bottom safe-area inset.
 *
 * The camera runs full-bleed underneath it, so anything the camera puts near the bottom has
 * to clear this by hand — there is no layout flow to do it for them. Shared so the pill's
 * height and the space reserved for it can't drift apart.
 */
export const NAV_HEIGHT = 72;

/** @deprecated Import from './typography' — re-exported so existing imports keep compiling. */
export { Typography } from './typography';
