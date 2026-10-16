import * as yup from 'yup'

import {
  CURRENCIES,
  GOAL_KINDS,
  isDayKey,
  type Activity,
  type Currency,
  type DayKey,
  type Goal,
  type GoalKind,
} from '~/core'
import type { GoalInput } from '~/features/tracking/hooks'
import type { TranslationKey } from '~/services/i18n'

export const MAX_STEPS = 20
export const MAX_GOAL_ACTIVITIES = 8

export type StepValues = { id: string; name: string; done: boolean }

/** The form keeps numbers as the text the user typed until it is saved. */
export type GoalFormValues = {
  name: string
  kind: GoalKind
  activityIds: string[]
  /** `count`: the total, in hours for timed activities. `money`: the amount. */
  target: string
  level: string
  /** Required for a `skill` goal, optional ('' = none) for a `money` one. */
  skillId: string
  steps: StepValues[]
  currency: Currency
  monthlyPlan: string
  startDay: string
  deadline: string
}

export const parseNumber = (text: string) =>
  Number(text.trim().replace(',', '.'))

const isPositive = (text: string | undefined) => {
  const value = parseNumber(text ?? '')
  return Number.isFinite(value) && value > 0
}

const isLevel = (text: string | undefined) => {
  const value = parseNumber(text ?? '')
  return Number.isInteger(value) && value >= 1 && value <= 999
}

const isBlankOrNotNegative = (text: string | undefined) => {
  if (!text || text.trim() === '') return true
  const value = parseNumber(text)
  return Number.isFinite(value) && value >= 0
}

// Messages are translation keys; the form translates them when it shows them.
const required: TranslationKey = 'error_required'
const positive: TranslationKey = 'error_positive'
const tooLong: TranslationKey = 'error_too_long'
const pickActivity: TranslationKey = 'error_pick_activity'
const addStep: TranslationKey = 'error_steps'
const wholeLevel: TranslationKey = 'error_level'
const aDate: TranslationKey = 'error_date'
const notNegative: TranslationKey = 'error_not_negative'

export const goalFormSchema = yup.object({
  name: yup.string().trim().required(required).max(80, tooLong),
  kind: yup
    .mixed<GoalKind>()
    .oneOf([...GOAL_KINDS])
    .required(),
  activityIds: yup
    .array()
    .of(yup.string().required())
    .when('kind', ([kind], schema) =>
      kind === 'count'
        ? schema.min(1, pickActivity).max(MAX_GOAL_ACTIVITIES)
        : schema,
    ),
  target: yup
    .string()
    .when('kind', ([kind], schema) =>
      kind === 'count' || kind === 'money'
        ? schema.test('positive', positive, isPositive)
        : schema,
    ),
  level: yup
    .string()
    .when('kind', ([kind], schema) =>
      kind === 'skill' ? schema.test('level', wholeLevel, isLevel) : schema,
    ),
  skillId: yup
    .string()
    .when('kind', ([kind], schema) =>
      kind === 'skill' ? schema.required(required) : schema,
    ),
  steps: yup.array().when('kind', ([kind], schema) =>
    kind === 'steps'
      ? schema
          .of(
            yup.object({
              id: yup.string().required(),
              name: yup.string().trim().required(required).max(80, tooLong),
              done: yup.boolean().required(),
            }),
          )
          .min(1, addStep)
          .max(MAX_STEPS)
      : schema,
  ),
  currency: yup
    .mixed<Currency>()
    .oneOf([...CURRENCIES])
    .required(),
  monthlyPlan: yup
    .string()
    .when('kind', ([kind], schema) =>
      kind === 'money'
        ? schema.test('plan', notNegative, isBlankOrNotNegative)
        : schema,
    ),
  startDay: yup
    .string()
    .when('kind', ([kind], schema) =>
      kind === 'count' ? schema.test('day', aDate, isDayKey) : schema,
    ),
  deadline: yup.string().test('day', aDate, value => !value || isDayKey(value)),
})

/** Two activities add up only when they are counted in the same thing. */
export const countedAlike = (one: Activity, other: Activity) =>
  one.kind === other.kind &&
  (one.kind !== 'count' || one.unit.trim() === other.unit.trim())

/** A goal over timed activities is typed in hours and stored in minutes. */
export const isTimed = (activityIds: string[], activities: Activity[]) =>
  activities.find(activity => activityIds.includes(activity.id))?.kind ===
  'time'

const MINUTES_IN_HOUR = 60

const text = (value: number) => String(value)

type Defaults = {
  today: DayKey
  defaultSkillId: string
  activities: Activity[]
}

export const goalFormValues = (
  goal: Goal | undefined,
  { today, defaultSkillId, activities }: Defaults,
): GoalFormValues => {
  if (!goal) {
    return {
      name: '',
      kind: 'money',
      activityIds: [],
      target: '',
      level: '5',
      skillId: '',
      steps: [],
      currency: 'UAH',
      monthlyPlan: '',
      startDay: today,
      deadline: '',
    }
  }

  const timed = goal.kind === 'count' && isTimed(goal.activityIds, activities)
  const amount = timed ? goal.target / MINUTES_IN_HOUR : goal.target

  return {
    name: goal.name,
    kind: goal.kind,
    activityIds: goal.activityIds,
    target: goal.kind === 'count' || goal.kind === 'money' ? text(amount) : '',
    level: goal.kind === 'skill' ? text(goal.target) : '5',
    skillId:
      goal.skillId || (goal.kind === 'skill' ? defaultSkillId : goal.skillId),
    steps: goal.steps.map(step => ({ ...step })),
    currency: goal.currency || 'UAH',
    monthlyPlan: goal.monthlyPlan > 0 ? text(goal.monthlyPlan) : '',
    startDay: goal.startDay,
    deadline: goal.deadline,
  }
}

/**
 * Valid form values as a goal. Fields that do not belong to the chosen kind
 * are reset rather than stored, so a checklist never carries a currency.
 */
export const goalFromForm = (
  values: GoalFormValues,
  activities: Activity[],
  today: DayKey,
): GoalInput => {
  const base = {
    name: values.name.trim(),
    kind: values.kind,
    target: 0,
    activityIds: [] as string[],
    skillId: '',
    steps: [] as StepValues[],
    currency: '' as Currency | '',
    monthlyPlan: 0,
    startDay: isDayKey(values.startDay) ? values.startDay : today,
    deadline: values.deadline,
  }

  if (values.kind === 'count') {
    const timed = isTimed(values.activityIds, activities)
    return {
      ...base,
      target: parseNumber(values.target) * (timed ? MINUTES_IN_HOUR : 1),
      activityIds: values.activityIds,
    }
  }

  if (values.kind === 'skill') {
    return {
      ...base,
      target: parseNumber(values.level),
      skillId: values.skillId,
    }
  }

  if (values.kind === 'steps') {
    return {
      ...base,
      steps: values.steps.map(step => ({
        id: step.id,
        name: step.name.trim(),
        done: step.done,
      })),
    }
  }

  const plan = parseNumber(values.monthlyPlan)
  return {
    ...base,
    target: parseNumber(values.target),
    skillId: values.skillId,
    currency: values.currency,
    monthlyPlan: values.monthlyPlan.trim() !== '' && plan > 0 ? plan : 0,
  }
}
