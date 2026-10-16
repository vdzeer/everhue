/** A number as people write it: whole when it is whole, else one decimal. */
export const formatAmount = (value: number) =>
  Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10)

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`

/** Splits minutes for "6 h 20 min"; the caller supplies the unit words. */
export const splitMinutes = (minutes: number) => {
  const whole = Math.round(minutes)
  return { hours: Math.floor(whole / 60), minutes: whole % 60 }
}

/** A sum as the reader's language writes it; cents only when there are some. */
export const formatMoney = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)

export const DAY_LONG = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
} as const
export const DAY_SHORT = { day: 'numeric', month: 'long' } as const
export const DAY_FULL = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
} as const

/**
 * A `YYYY-MM-DD` day in words. The day is a calendar date, not a moment, so
 * it is formatted in UTC and never shifts with the reader's time zone.
 */
export const formatDay = (
  day: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) => {
  const [year, month, date] = day.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, date)))
}
