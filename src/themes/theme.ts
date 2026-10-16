import {
  breakpoints,
  colors,
  insets,
  motion,
  radii,
  realms,
  sizes,
  spacing,
  sprite,
  text,
} from './tokens'

export const theme = {
  colors,
  realms,
  sprite,
  spacing,
  radii,
  sizes,
  breakpoints,
  insets,
  text,
  motion,
} as const

export type AppTheme = typeof theme
