import {
  HEATMAP_WEEKS,
  buildHeatmap,
  buildHero,
  effortByDay,
  heatLevel,
  weekEffort,
} from '../stats'
import { makeLog, makeSkill } from './fixtures'

const MONDAY = '2026-10-12'

describe('effortByDay', () => {
  it('adds up effort minutes per day', () => {
    const logs = [
      makeLog({ day: MONDAY, effortMinutes: 10 }),
      makeLog({ day: MONDAY, effortMinutes: 5 }),
      makeLog({ day: '2026-10-11', effortMinutes: 30 }),
    ]

    expect(effortByDay(logs)).toEqual({ [MONDAY]: 15, '2026-10-11': 30 })
  })
})

describe('heatLevel', () => {
  it.each([
    [0, 0],
    [1, 1],
    [19, 1],
    [20, 2],
    [59, 2],
    [60, 3],
    [300, 3],
  ])('%i minutes is level %i', (minutes, level) => {
    expect(heatLevel(minutes)).toBe(level)
  })
})

describe('buildHeatmap', () => {
  it('builds Monday-first weeks ending with the current one', () => {
    const map = buildHeatmap([], '2026-10-14')

    expect(map).toHaveLength(HEATMAP_WEEKS)
    expect(map.every(week => week.length === 7)).toBe(true)
    expect(map[HEATMAP_WEEKS - 1].map(cell => cell.day)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
    expect(map[0][0].day).toBe('2026-04-20')
  })

  it('marks the days after today as future and leaves them empty', () => {
    const logs = [makeLog({ day: '2026-10-14', effortMinutes: 45 })]

    const lastWeek = buildHeatmap(logs, '2026-10-14')[HEATMAP_WEEKS - 1]

    expect(lastWeek.map(cell => cell.future)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ])
    expect(lastWeek[2].level).toBe(2)
    expect(lastWeek[3].level).toBe(0)
  })
})

describe('weekEffort', () => {
  it('lists the current week and flags today', () => {
    const logs = [
      makeLog({ day: MONDAY, effortMinutes: 15 }),
      makeLog({ day: '2026-10-11', effortMinutes: 99 }),
    ]

    const week = weekEffort(logs, '2026-10-13')

    expect(week.map(day => day.minutes)).toEqual([15, 0, 0, 0, 0, 0, 0])
    expect(week.map(day => day.isToday)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ])
  })
})

describe('buildHero', () => {
  it('derives levels, streak and totals from the logs', () => {
    const reading = makeSkill({ id: 'reading', name: 'Reading', createdAt: 2 })
    const languages = makeSkill({ id: 'languages', createdAt: 1 })
    const archived = makeSkill({ id: 'old', archived: true })
    const logs = [
      makeLog({ skillId: 'reading', day: '2026-10-11', effortMinutes: 40 }),
      makeLog({ skillId: 'languages', day: MONDAY, effortMinutes: 10 }),
    ]

    const hero = buildHero([languages, reading, archived], logs, MONDAY)

    // 40 on Sunday, then 10 × 1.05 rounded on Monday.
    expect(hero.xp.total).toBe(51)
    expect(hero.hero.level).toBe(1)
    expect(hero.skills.map(entry => entry.skill.id)).toEqual([
      'reading',
      'languages',
    ])
    expect(hero.skills[0].progress.level).toBe(2)
    expect(hero.streak).toBe(2)
    expect(hero.consistency).toBe(1)
    expect(hero.weekMinutes).toBe(10)
  })

  it('shows a new user at level 0 with every skill listed', () => {
    const skill = makeSkill()

    const hero = buildHero([skill], [], MONDAY)

    expect(hero.hero.level).toBe(0)
    expect(hero.skills).toHaveLength(1)
    expect(hero.streak).toBe(0)
    expect(hero.consistency).toBe(0)
  })

  it('reports the freezes in hand and a day one of them covered', () => {
    // A week from Monday the 5th, nothing on Monday the 12th, today Tuesday.
    const logs = Array.from({ length: 7 }, (_, offset) =>
      makeLog({ day: `2026-10-${String(5 + offset).padStart(2, '0')}` }),
    )

    const hero = buildHero([], logs, '2026-10-13')

    expect(hero.streak).toBe(7)
    expect(hero.frozenYesterday).toBe(true)
    // One arrived on Monday the 12th and was spent the same day.
    expect(hero.freezes).toBe(0)
  })

  it('keeps the streak bonus across a frozen day', () => {
    const logs = [
      ...Array.from({ length: 7 }, (_, offset) =>
        makeLog({
          day: `2026-10-${String(5 + offset).padStart(2, '0')}`,
          effortMinutes: 0,
        }),
      ),
      makeLog({ id: 'after', day: '2026-10-13', effortMinutes: 100 }),
    ]

    // Five or more days in a row before it: the full 25% bonus.
    expect(buildHero([], logs, '2026-10-13').xp.byLog.after).toBe(125)
  })
})
