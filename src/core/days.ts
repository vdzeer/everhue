import type { DayKey } from './types'

const DAY_MS = 86_400_000

const pad = (value: number) => String(value).padStart(2, '0')

/** The local calendar date of a moment, as the user's device sees it. */
export const dayKey = (date: Date): DayKey =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const isDayKey = (value: unknown): value is DayKey =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

// Day arithmetic runs on UTC midnights: a local-time Date would gain or lose
// an hour on a daylight-saving change and land on the wrong day.
const toUtc = (key: DayKey) => {
  const [year, month, day] = key.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

const fromUtc = (ms: number): DayKey => new Date(ms).toISOString().slice(0, 10)

export const addDays = (key: DayKey, amount: number): DayKey =>
  fromUtc(toUtc(key) + amount * DAY_MS)

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export const daysBetween = (from: DayKey, to: DayKey) =>
  Math.round((toUtc(to) - toUtc(from)) / DAY_MS)

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export const weekdayOf = (key: DayKey) => {
  const jsDay = new Date(toUtc(key)).getUTCDay()
  return jsDay === 0 ? 7 : jsDay
}

/** The Monday of the week `key` falls in. */
export const weekStart = (key: DayKey): DayKey =>
  addDays(key, 1 - weekdayOf(key))

/** Monday to Sunday of the week `key` falls in. */
export const weekDays = (key: DayKey): DayKey[] =>
  Array.from({ length: 7 }, (_, index) => addDays(weekStart(key), index))

/** The calendar month of a day, `YYYY-MM`. */
export const monthKey = (key: DayKey) => key.slice(0, 7)

/**
 * Calendar months from the month of `from` through the month of `to`, both
 * counted: October to December is 3. Zero or less when `to` is earlier.
 */
export const monthsThrough = (from: DayKey, to: DayKey) => {
  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1
}
