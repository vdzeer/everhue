import { addDays } from '../days'
import {
  FREEZE_MAX,
  activeDays,
  buildStreaks,
  consistency,
  currentStreak,
  streakBefore,
} from '../streaks'
import { makeLog } from './fixtures'

const days = (...keys: string[]) => new Set(keys)

describe('activeDays', () => {
  it('collects each day once', () => {
    const logs = [
      makeLog({ day: '2026-10-12' }),
      makeLog({ day: '2026-10-12' }),
      makeLog({ day: '2026-10-10' }),
    ]

    expect([...activeDays(logs)].sort()).toEqual(['2026-10-10', '2026-10-12'])
  })
})

describe('streakBefore', () => {
  it('counts the run that ends the day before', () => {
    const active = days('2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12')

    expect(streakBefore(active, '2026-10-12')).toBe(3)
    expect(streakBefore(active, '2026-10-09')).toBe(0)
  })

  it('is zero after a gap', () => {
    expect(streakBefore(days('2026-10-09'), '2026-10-12')).toBe(0)
  })
})

describe('currentStreak', () => {
  it('includes today once something is logged today', () => {
    const active = days('2026-10-10', '2026-10-11', '2026-10-12')

    expect(currentStreak(active, '2026-10-12')).toBe(3)
  })

  it('does not break while today is still empty', () => {
    expect(currentStreak(days('2026-10-10', '2026-10-11'), '2026-10-12')).toBe(
      2,
    )
  })

  it('ends once a whole day has passed empty', () => {
    expect(currentStreak(days('2026-10-09', '2026-10-10'), '2026-10-12')).toBe(
      0,
    )
  })

  it('is zero for a new user', () => {
    expect(currentStreak(days(), '2026-10-12')).toBe(0)
  })
})

describe('consistency', () => {
  it('is zero with nothing logged', () => {
    expect(consistency(days(), '2026-10-12')).toBe(0)
  })

  it('is 100% on the first active day', () => {
    expect(consistency(days('2026-10-12'), '2026-10-12')).toBe(1)
  })

  it('measures from the first log while the history is shorter than the window', () => {
    // Ten days since the first log, five of them active.
    const active = days(
      '2026-10-03',
      '2026-10-05',
      '2026-10-08',
      '2026-10-10',
      '2026-10-12',
    )

    expect(consistency(active, '2026-10-12')).toBe(0.5)
  })

  it('looks at the last 30 days for a longer history', () => {
    const active = days('2026-06-01', '2026-10-11', '2026-10-12')

    expect(consistency(active, '2026-10-12')).toBeCloseTo(2 / 30)
  })

  it('ignores days after today', () => {
    expect(consistency(days('2026-10-12', '2026-10-20'), '2026-10-12')).toBe(1)
  })
})

describe('streak freezes', () => {
  // 2026-10-05 is a Monday.
  const run = (from: string, length: number) =>
    Array.from({ length }, (_, offset) => addDays(from, offset))

  it('starts with none: the first freeze arrives with the next week', () => {
    // Tuesday and Wednesday done, Thursday missed.
    const active = days('2026-10-06', '2026-10-07')

    expect(buildStreaks(active, '2026-10-07').bank).toBe(0)
    expect(currentStreak(active, '2026-10-09')).toBe(0)
  })

  it('adds one every Monday', () => {
    const active = days(...run('2026-10-06', 14))

    expect(buildStreaks(active, '2026-10-11').bank).toBe(0)
    expect(buildStreaks(active, '2026-10-12').bank).toBe(1)
    expect(buildStreaks(active, '2026-10-19').bank).toBe(2)
  })

  it(`keeps no more than ${FREEZE_MAX}`, () => {
    const active = days(...run('2026-10-06', 60))

    expect(buildStreaks(active, '2026-12-04').bank).toBe(FREEZE_MAX)
  })

  it('spends one on a missed day and keeps the streak, without growing it', () => {
    // A week in a row, Tuesday the 13th missed, back on Wednesday.
    const active = days(...run('2026-10-06', 7), '2026-10-14')
    const timeline = buildStreaks(active, '2026-10-14')

    expect(timeline.frozen.has('2026-10-13')).toBe(true)
    expect(timeline.lengthOn.get('2026-10-12')).toBe(7)
    expect(timeline.lengthOn.get('2026-10-13')).toBe(7)
    expect(timeline.lengthOn.get('2026-10-14')).toBe(8)
    expect(timeline.bank).toBe(0)
  })

  it('ends the streak on the first missed day with no freeze left', () => {
    // One freeze in hand, two days missed in a row.
    const active = days(...run('2026-10-06', 7))

    expect(currentStreak(active, '2026-10-14')).toBe(7)
    expect(currentStreak(active, '2026-10-15')).toBe(0)
  })

  it('does not spend a freeze on today: the day is not over', () => {
    const active = days(...run('2026-10-06', 7))
    const timeline = buildStreaks(active, '2026-10-13', true)

    expect(timeline.bank).toBe(1)
    expect(timeline.frozen.size).toBe(0)
    expect(timeline.lengthOn.get('2026-10-13')).toBe(7)
  })

  it('does not spend a freeze when there is no streak to save', () => {
    // Active once, then idle for three weeks: the freezes pile up unspent.
    const timeline = buildStreaks(days('2026-10-06'), '2026-10-28')

    expect(timeline.frozen.size).toBe(0)
    expect(timeline.bank).toBe(FREEZE_MAX)
  })

  it('counts the days before a log across a frozen day', () => {
    const active = days(...run('2026-10-06', 7), '2026-10-14')

    expect(streakBefore(active, '2026-10-14')).toBe(7)
  })

  it('repairs the past when a forgotten day is logged', () => {
    const forgotten = days('2026-10-06', '2026-10-08')
    const repaired = days('2026-10-06', '2026-10-07', '2026-10-08')

    expect(currentStreak(forgotten, '2026-10-08')).toBe(1)
    expect(currentStreak(repaired, '2026-10-08')).toBe(3)
  })

  it('is empty before anything was logged', () => {
    expect(buildStreaks(days(), '2026-10-12')).toMatchObject({ bank: 0 })
    expect(buildStreaks(days('2026-10-12'), '2026-10-01').lengthOn.size).toBe(0)
  })
})
