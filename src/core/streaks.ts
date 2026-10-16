import { addDays, daysBetween, weekdayOf } from './days'
import type { DayKey, Log } from './types'

/** The days that have at least one log. */
export const activeDays = (logs: Log[]): Set<DayKey> =>
  new Set(logs.map(log => log.day))

/** A freeze arrives at the start of every week; this many can be kept. */
export const FREEZE_MAX = 3
const MONDAY = 1

export type StreakTimeline = {
  /** The streak as it stood at the end of each day walked. */
  lengthOn: Map<DayKey, number>
  /** Missed days a freeze covered: the streak went on, without growing. */
  frozen: Set<DayKey>
  /** Freezes in hand after the last day walked. */
  bank: number
}

const EMPTY: StreakTimeline = {
  lengthOn: new Map(),
  frozen: new Set(),
  bank: 0,
}

/**
 * Walks every day from the first active one to `until` and works out the
 * streak and the freezes. Nothing about them is stored: like XP they follow
 * from the logs alone, so logging a forgotten day repairs the past honestly.
 *
 * A freeze is added every Monday, up to `FREEZE_MAX`. A day with nothing
 * logged spends one and leaves the streak standing; with none left the streak
 * ends. `untilIsOpen` says the last day is not over yet: it cannot be missed.
 */
export const buildStreaks = (
  days: Set<DayKey>,
  until: DayKey,
  untilIsOpen = false,
): StreakTimeline => {
  const first = [...days].sort()[0]
  if (!first || daysBetween(first, until) < 0) return EMPTY

  const lengthOn = new Map<DayKey, number>()
  const frozen = new Set<DayKey>()
  let run = 0
  let bank = 0

  Array.from({ length: daysBetween(first, until) + 1 }, (_, offset) =>
    addDays(first, offset),
  ).forEach(day => {
    if (day !== first && weekdayOf(day) === MONDAY) {
      bank = Math.min(FREEZE_MAX, bank + 1)
    }

    if (days.has(day)) {
      run += 1
    } else if (day === until && untilIsOpen) {
      // Still time to do something today.
    } else if (run > 0 && bank > 0) {
      bank -= 1
      frozen.add(day)
    } else {
      run = 0
    }

    lengthOn.set(day, run)
  })

  return { lengthOn, frozen, bank }
}

/** The streak a log made on `day` builds on: the days in a row before it. */
export const streakBefore = (days: Set<DayKey>, day: DayKey) => {
  const yesterday = addDays(day, -1)
  return buildStreaks(days, yesterday).lengthOn.get(yesterday) ?? 0
}

/**
 * The streak the user sees. A day with nothing logged yet does not break it:
 * the streak only ends once a whole day has passed empty with no freeze left.
 */
export const currentStreak = (days: Set<DayKey>, today: DayKey) =>
  buildStreaks(days, today, true).lengthOn.get(today) ?? 0

export const CONSISTENCY_WINDOW_DAYS = 30

/**
 * Share of recent days with something logged, 0…1. The window is 30 days, or
 * shorter for someone who started less than 30 days ago, so a new user is not
 * shown 3% after their first perfect day. A frozen day is still a day off.
 */
export const consistency = (
  days: Set<DayKey>,
  today: DayKey,
  windowDays = CONSISTENCY_WINDOW_DAYS,
) => {
  const known = [...days].filter(day => daysBetween(day, today) >= 0).sort()
  if (known.length === 0) return 0

  const span = Math.min(windowDays, daysBetween(known[0], today) + 1)
  const active = known.filter(day => daysBetween(day, today) < span).length

  return active / span
}
