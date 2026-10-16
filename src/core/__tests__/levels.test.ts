import {
  HERO_LEVEL_COEFF,
  SKILL_LEVEL_COEFF,
  levelForXp,
  levelProgress,
  xpForLevel,
} from '../levels'

describe('skill levels', () => {
  it.each([
    [0, 0],
    [9, 0],
    [10, 1],
    [39, 1],
    [40, 2],
    [249, 4],
    [250, 5],
    [1000, 10],
    [6250, 25],
    [25000, 50],
  ])('%i XP is level %i', (xp, level) => {
    expect(levelForXp(xp, SKILL_LEVEL_COEFF)).toBe(level)
  })

  it('is the inverse of xpForLevel at every threshold', () => {
    const levels = Array.from({ length: 60 }, (_, index) => index)

    levels.forEach(level => {
      const threshold = xpForLevel(level, SKILL_LEVEL_COEFF)
      expect(levelForXp(threshold, SKILL_LEVEL_COEFF)).toBe(level)
      expect(levelForXp(threshold + 0.5, SKILL_LEVEL_COEFF)).toBe(level)
    })
  })

  it('treats negative XP as zero', () => {
    expect(levelForXp(-50, SKILL_LEVEL_COEFF)).toBe(0)
  })
})

describe('levelProgress', () => {
  it('reports how far through the level the XP is', () => {
    // Hero level 7 spans 1960…2560.
    expect(levelProgress(2140, HERO_LEVEL_COEFF)).toEqual({
      level: 7,
      xp: 2140,
      intoLevel: 180,
      span: 600,
      toNext: 420,
      ratio: 0.3,
    })
  })

  it('starts a fresh skill at level 0 with 10 XP to go', () => {
    expect(levelProgress(0, SKILL_LEVEL_COEFF)).toMatchObject({
      level: 0,
      intoLevel: 0,
      span: 10,
      toNext: 10,
      ratio: 0,
    })
  })
})
