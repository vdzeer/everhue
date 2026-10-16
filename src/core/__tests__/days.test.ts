import {
  addDays,
  dayKey,
  daysBetween,
  isDayKey,
  monthKey,
  monthsThrough,
  weekDays,
  weekStart,
  weekdayOf,
} from '../days'

describe('dayKey', () => {
  it('uses the local calendar date, zero-padded', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(dayKey(new Date(2026, 9, 12, 0, 0))).toBe('2026-10-12')
  })
})

describe('isDayKey', () => {
  it('accepts only YYYY-MM-DD strings', () => {
    expect(isDayKey('2026-10-12')).toBe(true)
    expect(isDayKey('12.10.2026')).toBe(false)
    expect(isDayKey('2026-10-12T10:00')).toBe(false)
    expect(isDayKey(20261012)).toBe(false)
  })
})

describe('addDays and daysBetween', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('does not slip a day across a daylight-saving change', () => {
    // Europe switches on the last Sundays of March and October.
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30')
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('counts days with a sign', () => {
    expect(daysBetween('2026-10-01', '2026-10-12')).toBe(11)
    expect(daysBetween('2026-10-12', '2026-10-01')).toBe(-11)
    expect(daysBetween('2026-10-12', '2026-10-12')).toBe(0)
  })
})

describe('weeks', () => {
  it('numbers weekdays from Monday = 1 to Sunday = 7', () => {
    expect(weekdayOf('2026-10-12')).toBe(1)
    expect(weekdayOf('2026-10-16')).toBe(5)
    expect(weekdayOf('2026-10-18')).toBe(7)
  })

  it('starts the week on Monday', () => {
    expect(weekStart('2026-10-12')).toBe('2026-10-12')
    expect(weekStart('2026-10-18')).toBe('2026-10-12')
    expect(weekStart('2026-10-19')).toBe('2026-10-19')
  })

  it('lists Monday to Sunday', () => {
    expect(weekDays('2026-10-14')).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
  })
})

describe('months', () => {
  it('names the calendar month of a day', () => {
    expect(monthKey('2026-10-12')).toBe('2026-10')
  })

  it('counts months with both ends included', () => {
    expect(monthsThrough('2026-10-12', '2026-10-31')).toBe(1)
    expect(monthsThrough('2026-10-12', '2026-12-01')).toBe(3)
    expect(monthsThrough('2026-10-12', '2027-06-01')).toBe(9)
  })

  it('is zero or less once the month has passed', () => {
    expect(monthsThrough('2026-10-12', '2026-09-30')).toBe(0)
  })
})
