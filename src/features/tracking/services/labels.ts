import { dailyTarget, type Activity, type Schedule } from '~/core'
import { formatAmount, splitMinutes } from '~/services/format'
import type { Translate, TranslationKey } from '~/services/i18n'

export const WEEKDAY_KEYS: TranslationKey[] = [
  'weekday_1',
  'weekday_2',
  'weekday_3',
  'weekday_4',
  'weekday_5',
  'weekday_6',
  'weekday_7',
]

/** The unit an activity is counted in; empty for a yes-or-no one. */
export const unitLabel = (activity: Activity, t: Translate) => {
  if (activity.kind === 'time') return t('unit_min')
  if (activity.kind === 'count') return activity.unit
  return ''
}

/** "15 min", or "6 h 20 min" from an hour up. */
export const durationLabel = (totalMinutes: number, t: Translate) => {
  const { hours, minutes } = splitMinutes(totalMinutes)
  if (hours === 0) return `${minutes} ${t('unit_min')}`
  if (minutes === 0) return `${hours} ${t('unit_hour')}`
  return `${hours} ${t('unit_hour')} ${minutes} ${t('unit_min')}`
}

export const scheduleLabel = (schedule: Schedule, t: Translate) => {
  if (schedule.type === 'weekly') {
    return t('schedule_weekly', { times: schedule.times })
  }
  if (schedule.type === 'weekdays') {
    return [...schedule.days]
      .sort((a, b) => a - b)
      .map(day => t(WEEKDAY_KEYS[day - 1]).toLowerCase())
      .join(', ')
  }
  return t('schedule_daily')
}

/** The one-line summary under an activity's name in the plan. */
export const activityMeta = (activity: Activity, t: Translate) => {
  const amount =
    activity.kind === 'check'
      ? t('meta_check')
      : `${formatAmount(dailyTarget(activity))} ${unitLabel(activity, t)}`.trim()

  return [
    amount,
    scheduleLabel(activity.schedule, t),
    activity.parts.length > 0
      ? t('meta_parts', { count: activity.parts.length })
      : '',
  ]
    .filter(Boolean)
    .join(' · ')
}
