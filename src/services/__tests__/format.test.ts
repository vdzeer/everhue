import {
  DAY_FULL,
  DAY_LONG,
  formatAmount,
  formatDay,
  formatMoney,
  formatPercent,
  splitMinutes,
} from '../format'

/** Intl separates with no-break spaces; tests compare plain ones. */
const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, ' ')

describe('formatAmount', () => {
  it('keeps whole numbers whole and rounds the rest to one decimal', () => {
    expect(formatAmount(20)).toBe('20')
    expect(formatAmount(7.5)).toBe('7.5')
    expect(formatAmount(1.26)).toBe('1.3')
    expect(formatAmount(0)).toBe('0')
  })
})

describe('formatPercent', () => {
  it('rounds to a whole percent', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(0.666)).toBe('67%')
    expect(formatPercent(1)).toBe('100%')
  })
})

describe('splitMinutes', () => {
  it('splits into hours and minutes', () => {
    expect(splitMinutes(380)).toEqual({ hours: 6, minutes: 20 })
    expect(splitMinutes(45)).toEqual({ hours: 0, minutes: 45 })
    expect(splitMinutes(120)).toEqual({ hours: 2, minutes: 0 })
  })

  it('rounds before splitting, so 59.6 minutes is an hour', () => {
    expect(splitMinutes(59.6)).toEqual({ hours: 1, minutes: 0 })
  })
})

describe('formatMoney', () => {
  it('writes whole sums without cents', () => {
    expect(plain(formatMoney(1500, 'USD', 'en'))).toBe('$1,500')
  })

  it('groups thousands the way the language does', () => {
    // Browsers and Node disagree on the hryvnia sign (₴ or грн), so only the
    // number is pinned down.
    expect(plain(formatMoney(60000, 'UAH', 'uk'))).toMatch(/^60 000 \S+$/)
  })

  it('writes cents when there are some', () => {
    expect(plain(formatMoney(99.5, 'EUR', 'en'))).toBe('€99.50')
  })

  it('keeps the sign of money taken out', () => {
    expect(plain(formatMoney(-500, 'USD', 'en'))).toBe('-$500')
  })
})

describe('formatDay', () => {
  it('writes a calendar day in the reader language', () => {
    expect(formatDay('2026-10-12', 'en', DAY_FULL)).toBe('October 12, 2026')
    expect(plain(formatDay('2026-10-12', 'uk', DAY_LONG))).toBe(
      'понеділок, 12 жовтня',
    )
  })

  it('names the same day whatever the time zone of the device', () => {
    const zones = ['Pacific/Kiritimati', 'Europe/Kyiv', 'America/Los_Angeles']
    const original = process.env.TZ

    zones.forEach(zone => {
      process.env.TZ = zone
      expect(formatDay('2026-01-01', 'en', DAY_FULL)).toBe('January 1, 2026')
    })
    process.env.TZ = original
  })
})
