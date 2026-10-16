import type { Realm } from '~/core'

/**
 * Every raw value in the app lives in this file. Components read tokens
 * through the theme; a hex or px literal in a `styled.ts` fails a test.
 *
 * Colours are named by role, not by hue: three surface levels, two text
 * tones, one accent. There are two palettes, light and dark, with the same
 * roles. A component never sees a hex: `colors.surface` is a CSS variable,
 * and the palette behind it is swapped on the document (see `GlobalStyle`),
 * so changing the theme repaints nothing in React.
 */
const lightColors = {
  background: '#F3F2EE',
  surface: '#FFFFFF',
  surfaceSubtle: '#FAF9F6',
  /** Bar tracks, idle tiles, anything "not done yet". */
  surfaceSunken: '#ECEAE4',
  border: '#E2E0D9',
  borderStrong: '#C9C6BE',
  onSurface: '#1A191E',
  onSurfaceMuted: '#65626D',
  /** Filled buttons and the current tab. */
  primary: '#1A191E',
  onPrimary: '#FFFFFF',
  /** XP and hero progress. */
  accent: '#F2B233',
  /** Behind a reached goal that has no realm: pale enough for muted text. */
  accentSoft: '#FBEBC2',
  accentStrong: '#B47B0B',
  success: '#2A9D6A',
  danger: '#B4322F',
  dangerSoft: '#FBE9E7',
  /** The keyboard focus ring: readable on a page, a card and a filled button. */
  focus: '#B47B0B',
  /** The activity map, from a little done to a lot. */
  heatLow: '#F7DC98',
  heatMid: '#F2B233',
  heatHigh: '#B47B0B',
  /** The gray, colourless world behind the hero. */
  sceneSky: '#F3F2EE',
  sceneGround: '#E6E4DD',
  sceneShape: '#D6D3CC',
} as const

export type ColorToken = keyof typeof lightColors

const darkColors: Record<ColorToken, string> = {
  background: '#121116',
  surface: '#1C1B21',
  surfaceSubtle: '#17161B',
  surfaceSunken: '#2A2930',
  border: '#2F2E36',
  borderStrong: '#55535E',
  onSurface: '#F2F1F5',
  onSurfaceMuted: '#A9A6B3',
  // Inverted: on a dark page the filled button is the light thing.
  primary: '#F2F1F5',
  onPrimary: '#1A191E',
  accent: '#F2B233',
  accentSoft: '#3F300E',
  accentStrong: '#F2B233',
  success: '#3DBE85',
  danger: '#F0736E',
  dangerSoft: '#3A1F1E',
  focus: '#B47B0B',
  // On a dark page "more" is brighter, so the scale runs the other way.
  heatLow: '#5A4312',
  heatMid: '#B47B0B',
  heatHigh: '#F2B233',
  // The hero's hair and tunic are dark, so the scene stays a pale gray.
  sceneSky: '#A19EA9',
  sceneGround: '#8C8994',
  sceneShape: '#7A7782',
}

type RealmPaints = { solid: string; tint: string; ink: string }

/**
 * Colour only appears on what has been done: an idle quest is gray, a started
 * one takes its realm's colour, a finished one sits on the realm's tint.
 * `ink` is the realm colour that draws an icon on the tint.
 */
const lightRealms: Record<Realm, RealmPaints> = {
  library: { solid: '#7657DE', tint: '#ECE7FB', ink: '#6748D2' },
  forge: { solid: '#E4573A', tint: '#FCE8E3', ink: '#C9432A' },
  harbor: { solid: '#2E7FE8', tint: '#E4EEFC', ink: '#2468C4' },
  neon: { solid: '#D043A0', tint: '#FBE6F3', ink: '#B5358A' },
  gardens: { solid: '#2A9D6A', tint: '#DFF3E9', ink: '#1F8558' },
  bay: { solid: '#D99A1B', tint: '#FBF0D6', ink: '#96690B' },
}

const darkRealms: Record<Realm, RealmPaints> = {
  library: { solid: '#8E72F0', tint: '#2A2350', ink: '#B9A8F7' },
  forge: { solid: '#F0694D', tint: '#45211A', ink: '#F7A593' },
  harbor: { solid: '#4A93F0', tint: '#1B2F4D', ink: '#9CC4F8' },
  neon: { solid: '#E05CB3', tint: '#451D3A', ink: '#F0A3D6' },
  gardens: { solid: '#3DBE85', tint: '#173A2B', ink: '#8FE0BC' },
  bay: { solid: '#E5A82E', tint: '#40300F', ink: '#F2CD7A' },
}

/** The raw values. Only the theme plumbing, the icons and tests read these. */
export const palettes = {
  light: { colors: lightColors, realms: lightRealms },
  dark: { colors: darkColors, realms: darkRealms },
} as const

export type ThemeName = keyof typeof palettes

const COLOR_TOKENS = Object.keys(lightColors) as ColorToken[]
const REALM_IDS = Object.keys(lightRealms) as Realm[]
const REALM_PAINTS = ['solid', 'tint', 'ink'] as const

const colorVariable = (token: ColorToken) => `--color-${token}`
const realmVariable = (realm: Realm, paint: keyof RealmPaints) =>
  `--realm-${realm}-${paint}`

/** What components use: each role as a reference to its CSS variable. */
export const colors = Object.fromEntries(
  COLOR_TOKENS.map(token => [token, `var(${colorVariable(token)})`]),
) as Record<ColorToken, string>

export const realms = Object.fromEntries(
  REALM_IDS.map(realm => [
    realm,
    Object.fromEntries(
      REALM_PAINTS.map(paint => [paint, `var(${realmVariable(realm, paint)})`]),
    ),
  ]),
) as Record<Realm, RealmPaints>

/** The declarations that give every variable its value in one palette. */
export const paletteCss = (name: ThemeName) =>
  [
    ...COLOR_TOKENS.map(
      token => `${colorVariable(token)}: ${palettes[name].colors[token]};`,
    ),
    ...REALM_IDS.flatMap(realm =>
      REALM_PAINTS.map(
        paint =>
          `${realmVariable(realm, paint)}: ${palettes[name].realms[realm][paint]};`,
      ),
    ),
  ].join('\n')

/** The hero is the one pixel-art element; these are its paints. */
export const sprite = {
  hair: '#3A2E4D',
  skin: '#EFC29A',
  ink: '#1A191E',
  tunic: '#3B4A8C',
  scarf: '#F2B233',
  legs: '#4A4458',
  boots: '#7A4B2A',
} as const

export const spacing = {
  none: '0',
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '40px',
  xxxl: '56px',
} as const

export const radii = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  pill: '999px',
} as const

/** Below this width the side menu becomes a tab bar along the bottom edge. */
export const breakpoints = {
  narrow: '760px',
} as const

/** Room a phone keeps for its notch and its home indicator. */
export const insets = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const

export const sizes = {
  hairline: '1px',
  /** Minimum touch target. */
  control: '44px',
  controlLarge: '52px',
  segment: '40px',
  icon: '20px',
  iconSmall: '16px',
  iconTile: '48px',
  iconTileSmall: '40px',
  badge: '28px',
  bar: '8px',
  barLarge: '12px',
  swatch: '14px',
  sidebar: '232px',
  /** Height the bottom tab bar takes away from a narrow page. */
  tabBar: '64px',
  navItem: '150px',
  content: '1080px',
  contentNarrow: '640px',
  columnWide: '520px',
  columnNarrow: '300px',
  textColumn: '240px',
  numberField: '88px',
  /** Narrowest a tile with a number and its caption may get before wrapping. */
  statTile: '132px',
  weekBar: '64px',
  heroScene: '168px',
  heroSceneLarge: '264px',
  heroGround: '36px',
  heroGroundLarge: '52px',
  signInScene: '420px',
  signInText: '460px',
  signInActions: '360px',
} as const

const families = {
  display: "var(--font-display), 'Trebuchet MS', sans-serif",
  body: 'var(--font-body), system-ui, sans-serif',
} as const

/**
 * The text scale. Every font size in the app is one of these: `<Text variant>`
 * picks one, and the few controls that style their own label read it here.
 */
export const text = {
  display: {
    family: families.display,
    size: '40px',
    line: '48px',
    weight: 600,
  },
  hero: { family: families.display, size: '28px', line: '36px', weight: 600 },
  title: { family: families.display, size: '20px', line: '28px', weight: 600 },
  subtitle: {
    family: families.display,
    size: '16px',
    line: '24px',
    weight: 600,
  },
  stat: { family: families.display, size: '18px', line: '24px', weight: 600 },
  clock: {
    family: families.display,
    size: 'clamp(64px, 11vw, 128px)',
    line: '1.1',
    weight: 600,
  },
  lead: { family: families.body, size: '18px', line: '28px', weight: 400 },
  body: { family: families.body, size: '16px', line: '24px', weight: 400 },
  bodyStrong: {
    family: families.body,
    size: '16px',
    line: '24px',
    weight: 600,
  },
  secondary: { family: families.body, size: '14px', line: '20px', weight: 400 },
  label: { family: families.body, size: '14px', line: '20px', weight: 600 },
  caption: { family: families.body, size: '13px', line: '18px', weight: 400 },
  /** Labels of the bottom tab bar: four of them share a phone's width. */
  tab: { family: families.body, size: '11px', line: '14px', weight: 600 },
} as const

export type TextVariant = keyof typeof text

export const motion = {
  fast: '120ms',
  base: '240ms',
} as const
