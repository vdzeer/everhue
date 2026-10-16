import { makeActivity } from '~/core/__tests__/fixtures'
import type { Translate } from '~/services/i18n'
import { LOCALES } from '~/services/i18n/locales'

import {
  activityMeta,
  durationLabel,
  scheduleLabel,
  unitLabel,
} from '../labels'

/** The English file with `{{placeholders}}` filled in, without i18next. */
const t: Translate = (key, values = {}) =>
  Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, String(value)),
    LOCALES.en.strings[key] as string,
  )

describe('unitLabel', () => {
  it('is minutes for time, the custom unit for count, nothing for a check', () => {
    expect(unitLabel(makeActivity({ kind: 'time' }), t)).toBe('min')
    expect(unitLabel(makeActivity({ kind: 'count', unit: 'pages' }), t)).toBe(
      'pages',
    )
    expect(unitLabel(makeActivity({ kind: 'check' }), t)).toBe('')
  })
})

describe('durationLabel', () => {
  it('drops the part that is zero', () => {
    expect(durationLabel(15, t)).toBe('15 min')
    expect(durationLabel(120, t)).toBe('2 h')
    expect(durationLabel(380, t)).toBe('6 h 20 min')
    expect(durationLabel(0, t)).toBe('0 min')
  })
})

describe('scheduleLabel', () => {
  it('names the three kinds of schedule', () => {
    expect(scheduleLabel({ type: 'daily' }, t)).toBe(t('schedule_daily'))
    expect(scheduleLabel({ type: 'weekly', times: 3 }, t)).toBe(
      t('schedule_weekly', { times: 3 }),
    )
  })

  it('lists weekdays Monday first, whatever order they were picked in', () => {
    expect(scheduleLabel({ type: 'weekdays', days: [5, 1, 3] }, t)).toBe(
      [t('weekday_1'), t('weekday_3'), t('weekday_5')]
        .map(day => day.toLowerCase())
        .join(', '),
    )
  })
})

describe('activityMeta', () => {
  it('joins amount, schedule and parts', () => {
    const activity = makeActivity({
      kind: 'time',
      parts: [
        { id: 'a', name: 'Cards', target: 5 },
        { id: 'b', name: 'Podcast', target: 5 },
      ],
    })

    expect(activityMeta(activity, t)).toBe(
      ['10 min', t('schedule_daily'), t('meta_parts', { count: 2 })].join(
        ' · ',
      ),
    )
  })

  it('says a check is a check instead of showing a number', () => {
    const activity = makeActivity({ kind: 'check', target: 1 })

    expect(activityMeta(activity, t)).toBe(
      [t('meta_check'), t('schedule_daily')].join(' · '),
    )
  })

  it('shows a counted amount with its own unit', () => {
    const activity = makeActivity({ kind: 'count', target: 20, unit: 'pages' })

    expect(activityMeta(activity, t).startsWith('20 pages')).toBe(true)
  })
})
