import {
  DAILY_EFFORT_CAP_MINUTES,
  computeXp,
  effortFor,
  streakMultiplier,
  xpForEffort,
} from '../xp'
import { makeActivity, makeLog } from './fixtures'

describe('effortFor', () => {
  it('takes timed minutes as they are', () => {
    expect(effortFor(makeActivity({ kind: 'time' }), 25)).toBe(25)
  })

  it('converts counted items through minutesPerUnit', () => {
    const reading = makeActivity({ kind: 'count', minutesPerUnit: 1.5 })

    expect(effortFor(reading, 20)).toBe(30)
  })

  it('gives a yes-or-no activity its fixed effort', () => {
    const bedtime = makeActivity({ kind: 'check', effortMinutes: 5 })

    expect(effortFor(bedtime, 1)).toBe(5)
  })
})

describe('xpForEffort', () => {
  it('gives one XP per minute for a manual log with no streak', () => {
    expect(xpForEffort(10, 'manual', 0)).toBe(10)
  })

  it('pays 20% more for the timer', () => {
    expect(xpForEffort(10, 'timer', 0)).toBe(12)
  })

  it('adds 5% per day in a row and stops at five days', () => {
    expect(streakMultiplier(0)).toBe(1)
    expect(streakMultiplier(3)).toBeCloseTo(1.15)
    expect(streakMultiplier(5)).toBeCloseTo(1.25)
    expect(streakMultiplier(40)).toBeCloseTo(1.25)
    expect(xpForEffort(10, 'timer', 5)).toBe(15)
  })
})

describe('computeXp', () => {
  it('sums XP per log, per skill and in total', () => {
    const english = makeLog({ skillId: 'languages', effortMinutes: 10 })
    const reading = makeLog({
      skillId: 'reading',
      activityId: 'activity-reading',
      effortMinutes: 30,
    })

    expect(computeXp([english, reading])).toEqual({
      byLog: { [english.id]: 10, [reading.id]: 30 },
      bySkill: { languages: 10, reading: 30 },
      total: 40,
    })
  })

  it('pays the streak bonus from the second day in a row', () => {
    const monday = makeLog({ day: '2026-10-12', effortMinutes: 20 })
    const tuesday = makeLog({ day: '2026-10-13', effortMinutes: 20 })
    const thursday = makeLog({ day: '2026-10-15', effortMinutes: 20 })

    const { byLog } = computeXp([monday, tuesday, thursday])

    expect(byLog[monday.id]).toBe(20)
    expect(byLog[tuesday.id]).toBe(21)
    // Wednesday was empty, so the run starts again.
    expect(byLog[thursday.id]).toBe(20)
  })

  it('stops paying one activity after the daily effort cap', () => {
    const logs = [100, 100, 100].map(effortMinutes =>
      makeLog({ effortMinutes, value: effortMinutes }),
    )

    const { byLog, total } = computeXp(logs)

    expect(logs.map(log => byLog[log.id])).toEqual([100, 100, 40])
    expect(total).toBe(DAILY_EFFORT_CAP_MINUTES)
  })

  it('keeps the cap per activity and per day', () => {
    const capped = makeLog({ effortMinutes: 300 })
    const otherActivity = makeLog({
      activityId: 'activity-other',
      effortMinutes: 60,
    })
    const nextDay = makeLog({ day: '2026-10-14', effortMinutes: 60 })

    const { byLog } = computeXp([capped, otherActivity, nextDay])

    expect(byLog[capped.id]).toBe(240)
    expect(byLog[otherActivity.id]).toBe(60)
    expect(byLog[nextDay.id]).toBe(60)
  })

  it('gives the same result whatever order the logs arrive in', () => {
    const logs = [
      makeLog({ day: '2026-10-12', effortMinutes: 200 }),
      makeLog({ day: '2026-10-12', effortMinutes: 200, source: 'timer' }),
      makeLog({ day: '2026-10-13', effortMinutes: 15 }),
      makeLog({ day: '2026-10-11', effortMinutes: 5, skillId: 'calm' }),
    ]

    expect(computeXp([...logs].reverse())).toEqual(computeXp(logs))
  })

  it('returns zeros for no logs', () => {
    expect(computeXp([])).toEqual({ byLog: {}, bySkill: {}, total: 0 })
  })
})
