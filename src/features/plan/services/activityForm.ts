import * as yup from 'yup'

import {
  ACTIVITY_KINDS,
  type Activity,
  type ActivityKind,
  type Schedule,
} from '~/core'
import type { ActivityInput } from '~/features/tracking/hooks'
import type { TranslationKey } from '~/services/i18n'

export const MAX_PARTS = 8

export type PartValues = { id: string; name: string; target: string }

/** The form keeps numbers as the text the user typed until it is saved. */
export type ActivityFormValues = {
  name: string
  skillId: string
  kind: ActivityKind
  target: string
  unit: string
  minutesPerUnit: string
  effortMinutes: string
  parts: PartValues[]
  scheduleType: Schedule['type']
  days: number[]
  times: string
}

export const parseNumber = (text: string) =>
  Number(text.trim().replace(',', '.'))

const isPositive = (text: string | undefined) => {
  const value = parseNumber(text ?? '')
  return Number.isFinite(value) && value > 0
}

const isTimesAWeek = (text: string | undefined) => {
  const value = parseNumber(text ?? '')
  return Number.isInteger(value) && value >= 1 && value <= 7
}

// Messages are translation keys; the form translates them when it shows them.
const required: TranslationKey = 'error_required'
const positive: TranslationKey = 'error_positive'
const tooLong: TranslationKey = 'error_too_long'
const pickDays: TranslationKey = 'error_days'

export const activityFormSchema = yup.object({
  name: yup.string().trim().required(required).max(80, tooLong),
  skillId: yup.string().required(required),
  kind: yup
    .mixed<ActivityKind>()
    .oneOf([...ACTIVITY_KINDS])
    .required(),
  // The daily target is typed in only when the parts do not add up to it.
  target: yup
    .string()
    .when(['kind', 'parts'], ([kind, parts], schema) =>
      kind !== 'check' && (parts as PartValues[]).length === 0
        ? schema.test('positive', positive, isPositive)
        : schema,
    ),
  unit: yup.string().max(16, tooLong),
  minutesPerUnit: yup
    .string()
    .when('kind', ([kind], schema) =>
      kind === 'count' ? schema.test('positive', positive, isPositive) : schema,
    ),
  effortMinutes: yup
    .string()
    .when('kind', ([kind], schema) =>
      kind === 'check' ? schema.test('positive', positive, isPositive) : schema,
    ),
  parts: yup.array().when('kind', ([kind], schema) =>
    kind === 'check'
      ? schema
      : schema
          .of(
            yup.object({
              id: yup.string().required(),
              name: yup.string().trim().required(required).max(40, tooLong),
              target: yup.string().test('positive', positive, isPositive),
            }),
          )
          .max(MAX_PARTS),
  ),
  scheduleType: yup
    .mixed<Schedule['type']>()
    .oneOf(['daily', 'weekdays', 'weekly'])
    .required(),
  days: yup
    .array()
    .of(yup.number().required())
    .when('scheduleType', ([type], schema) =>
      type === 'weekdays' ? schema.min(1, pickDays) : schema,
    ),
  times: yup
    .string()
    .when('scheduleType', ([type], schema) =>
      type === 'weekly' ? schema.test('times', positive, isTimesAWeek) : schema,
    ),
})

const text = (value: number) => String(value)

export const activityFormValues = (
  activity: Activity | undefined,
  defaultSkillId: string,
): ActivityFormValues => {
  if (!activity) {
    return {
      name: '',
      skillId: defaultSkillId,
      kind: 'time',
      target: '10',
      unit: '',
      minutesPerUnit: '1',
      effortMinutes: '5',
      parts: [],
      scheduleType: 'daily',
      days: [1, 2, 3, 4, 5],
      times: '3',
    }
  }

  const { schedule } = activity

  return {
    name: activity.name,
    skillId: activity.skillId,
    kind: activity.kind,
    target: text(activity.target),
    unit: activity.unit,
    minutesPerUnit: text(activity.minutesPerUnit),
    effortMinutes: text(activity.effortMinutes || 5),
    parts: activity.parts.map(part => ({
      id: part.id,
      name: part.name,
      target: text(part.target),
    })),
    scheduleType: schedule.type,
    days: schedule.type === 'weekdays' ? schedule.days : [1, 2, 3, 4, 5],
    times: schedule.type === 'weekly' ? text(schedule.times) : '3',
  }
}

const scheduleFromForm = (values: ActivityFormValues): Schedule => {
  if (values.scheduleType === 'weekdays') {
    return { type: 'weekdays', days: [...values.days].sort((a, b) => a - b) }
  }
  if (values.scheduleType === 'weekly') {
    return { type: 'weekly', times: parseNumber(values.times) }
  }
  return { type: 'daily' }
}

/**
 * Valid form values as an activity. Fields that do not apply to the chosen
 * kind are reset rather than stored, so a "yes or no" activity never carries
 * a leftover unit or parts from before it was switched.
 */
export const activityFromForm = (values: ActivityFormValues): ActivityInput => {
  const isCheck = values.kind === 'check'
  const isCount = values.kind === 'count'
  const parts = isCheck
    ? []
    : values.parts.map(part => ({
        id: part.id,
        name: part.name.trim(),
        target: parseNumber(part.target),
      }))
  const partsTotal = parts.reduce((sum, part) => sum + part.target, 0)
  const ownTarget = isCheck ? 1 : parseNumber(values.target)

  return {
    name: values.name.trim(),
    skillId: values.skillId,
    kind: values.kind,
    target: parts.length > 0 ? partsTotal : ownTarget,
    unit: isCount ? values.unit.trim() : '',
    minutesPerUnit: isCount ? parseNumber(values.minutesPerUnit) : 1,
    effortMinutes: isCheck ? parseNumber(values.effortMinutes) : 0,
    parts,
    schedule: scheduleFromForm(values),
  }
}
