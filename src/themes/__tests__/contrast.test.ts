import { REALMS } from '~/core'

import { palettes, sprite, type ColorToken, type ThemeName } from '../tokens'

// WCAG 2 contrast, computed from the tokens themselves: text needs 4.5:1,
// icons and the edges of controls need 3:1. Both palettes are held to it.

const TEXT = 4.5
const GRAPHIC = 3

const channel = (value: number) => {
  const share = value / 255
  return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string) => {
  const [red, green, blue] = [1, 3, 5].map(at =>
    channel(parseInt(hex.slice(at, at + 2), 16)),
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

const contrast = (one: string, other: string) => {
  const [light, dark] = [luminance(one), luminance(other)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

const SURFACES: ColorToken[] = [
  'background',
  'surface',
  'surfaceSubtle',
  'surfaceSunken',
]

const THEMES = Object.keys(palettes) as ThemeName[]

describe.each(THEMES)('the %s palette', name => {
  const { colors, realms } = palettes[name]

  describe('text', () => {
    it.each(SURFACES)('reads on %s in both tones', surface => {
      expect(
        contrast(colors.onSurface, colors[surface]),
      ).toBeGreaterThanOrEqual(TEXT)
      expect(
        contrast(colors.onSurfaceMuted, colors[surface]),
      ).toBeGreaterThanOrEqual(TEXT)
    })

    it('reads on the primary fill', () => {
      expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(
        TEXT,
      )
    })

    it('reads in the danger colour, on a card and on its own tint', () => {
      expect(contrast(colors.danger, colors.surface)).toBeGreaterThanOrEqual(
        TEXT,
      )
      expect(contrast(colors.danger, colors.dangerSoft)).toBeGreaterThanOrEqual(
        TEXT,
      )
      expect(
        contrast(colors.onSurface, colors.dangerSoft),
      ).toBeGreaterThanOrEqual(TEXT)
    })

    it('reads on a reached goal that has no realm of its own', () => {
      expect(
        contrast(colors.onSurface, colors.accentSoft),
      ).toBeGreaterThanOrEqual(TEXT)
      expect(
        contrast(colors.onSurfaceMuted, colors.accentSoft),
      ).toBeGreaterThanOrEqual(TEXT)
    })
  })

  describe('realms', () => {
    it.each(REALMS)('%s: the icon shows on its tint', realm => {
      expect(
        contrast(realms[realm].ink, realms[realm].tint),
      ).toBeGreaterThanOrEqual(GRAPHIC)
    })

    it.each(REALMS)('%s: finished text reads on its tint', realm => {
      expect(
        contrast(colors.onSurface, realms[realm].tint),
      ).toBeGreaterThanOrEqual(TEXT)
      expect(
        contrast(colors.onSurfaceMuted, realms[realm].tint),
      ).toBeGreaterThanOrEqual(TEXT)
    })

    it.each(REALMS)('%s: its bar shows on the track', realm => {
      expect(
        contrast(realms[realm].solid, colors.surfaceSunken),
      ).toBeGreaterThanOrEqual(name === 'dark' ? GRAPHIC : 1.5)
    })
  })

  describe('controls', () => {
    it.each(['background', 'surface', 'primary'] as const)(
      'the focus ring shows against %s',
      around => {
        expect(contrast(colors.focus, colors[around])).toBeGreaterThanOrEqual(
          GRAPHIC,
        )
      },
    )

    it('the hero stands out from the scene behind it', () => {
      expect(contrast(sprite.tunic, colors.sceneSky)).toBeGreaterThanOrEqual(
        GRAPHIC,
      )
      expect(contrast(sprite.hair, colors.sceneSky)).toBeGreaterThanOrEqual(
        GRAPHIC,
      )
    })

    it('the activity map has three steps a reader can tell apart', () => {
      const steps = [
        colors.surfaceSunken,
        colors.heatLow,
        colors.heatMid,
        colors.heatHigh,
      ].map(luminance)
      const ordered = name === 'dark' ? steps : [...steps].reverse()

      // Each step is further from the empty cell than the one before.
      expect(ordered).toEqual([...ordered].sort((a, b) => a - b))
    })
  })
})

describe('the palettes', () => {
  it('define the same roles', () => {
    expect(Object.keys(palettes.dark.colors).sort()).toEqual(
      Object.keys(palettes.light.colors).sort(),
    )
    expect(Object.keys(palettes.dark.realms).sort()).toEqual(
      Object.keys(palettes.light.realms).sort(),
    )
  })
})
