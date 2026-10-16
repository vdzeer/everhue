/**
 * Total XP needed to reach level L is `coeff × L²`, so every next level costs
 * more than the last: level 5 of a skill takes about a week of 30 minutes a
 * day, level 25 about half a year.
 */
export const SKILL_LEVEL_COEFF = 10
export const HERO_LEVEL_COEFF = 40

export const xpForLevel = (level: number, coeff: number) =>
  coeff * level * level

export const levelForXp = (xp: number, coeff: number) =>
  Math.floor(Math.sqrt(Math.max(0, xp) / coeff))

export type LevelProgress = {
  level: number
  xp: number
  /** XP earned inside the current level. */
  intoLevel: number
  /** XP the current level spans. */
  span: number
  /** XP still missing for the next level. */
  toNext: number
  /** 0…1, how far through the current level. */
  ratio: number
}

export const levelProgress = (xp: number, coeff: number): LevelProgress => {
  const safeXp = Math.max(0, xp)
  const level = levelForXp(safeXp, coeff)
  const floor = xpForLevel(level, coeff)
  const span = xpForLevel(level + 1, coeff) - floor
  const intoLevel = safeXp - floor

  return {
    level,
    xp: safeXp,
    intoLevel,
    span,
    toNext: span - intoLevel,
    ratio: intoLevel / span,
  }
}
