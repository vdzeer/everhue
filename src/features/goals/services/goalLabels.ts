import type {
  Activity,
  Goal,
  GoalKind,
  GoalProgress,
  Realm,
  Skill,
} from '~/core'
import { durationLabel } from '~/features/tracking/services'
import {
  DAY_FULL,
  formatAmount,
  formatDay,
  formatMoney,
} from '~/services/format'
import type { Locale, Translate, TranslationKey } from '~/services/i18n'

/** What a label needs besides the goal itself. */
export type GoalContext = {
  activities: Activity[]
  skills: Skill[]
  locale: Locale
  t: Translate
}

export const GOAL_KIND_LABEL: Record<GoalKind, TranslationKey> = {
  count: 'goal_kind_count',
  skill: 'goal_kind_skill',
  steps: 'goal_kind_steps',
  money: 'goal_kind_money',
}

export const GOAL_KIND_HINT: Record<GoalKind, TranslationKey> = {
  count: 'goal_kind_count_hint',
  skill: 'goal_kind_skill_hint',
  steps: 'goal_kind_steps_hint',
  money: 'goal_kind_money_hint',
}

export const GOAL_ICON = {
  count: 'target',
  skill: 'level',
  steps: 'steps',
  money: 'coin',
} as const

const firstActivity = (goal: Goal, activities: Activity[]) =>
  activities.find(activity => goal.activityIds.includes(activity.id))

/** The colour a goal borrows: its skill's, or its first activity's skill's. */
export const goalRealm = (
  goal: Goal,
  { activities, skills }: Pick<GoalContext, 'activities' | 'skills'>,
): Realm | undefined => {
  const skillId =
    goal.kind === 'count'
      ? firstActivity(goal, activities)?.skillId
      : goal.skillId
  return skills.find(skill => skill.id === skillId)?.realm
}

/** A number in the goal's own measure: money, time, or a counted unit. */
export const goalAmount = (
  goal: Goal,
  value: number,
  { activities, locale, t }: GoalContext,
) => {
  if (goal.kind === 'money' && goal.currency) {
    return formatMoney(value, goal.currency, locale)
  }

  const activity = firstActivity(goal, activities)
  if (activity?.kind === 'time') return durationLabel(value, t)
  if (activity?.kind === 'check') {
    return `${formatAmount(value)} ${t('unit_times')}`
  }
  return `${formatAmount(value)} ${activity?.unit ?? ''}`.trim()
}

export const goalProgressLabel = (
  { goal, done, target }: GoalProgress,
  context: GoalContext,
) => {
  if (goal.kind === 'skill') {
    return context.t('goal_progress_level', { done, target })
  }
  if (goal.kind === 'steps') {
    return context.t('goal_progress_steps', { done, target })
  }
  return context.t('goal_progress_amount', {
    done: goalAmount(goal, done, context),
    target: goalAmount(goal, target, context),
  })
}

/** "By 1 June 2027 · days left: 232", or null for a goal with no deadline. */
export const goalDeadlineLabel = (
  { goal, daysLeft, complete, overdue }: GoalProgress,
  { locale, t }: Pick<GoalContext, 'locale' | 't'>,
) => {
  if (!goal.deadline || daysLeft === null) return null

  const by = t('goal_deadline', {
    date: formatDay(goal.deadline, locale, DAY_FULL),
  })
  if (complete) return by
  if (overdue) return `${by} · ${t('goal_overdue', { count: -daysLeft })}`
  if (daysLeft === 0) return `${by} · ${t('goal_last_day')}`
  return `${by} · ${t('goal_days_left', { count: daysLeft })}`
}

/** What a goal that lost its source says instead of pretending to progress. */
export const goalWarning = (
  goal: Goal,
  { activities, skills }: Pick<GoalContext, 'activities' | 'skills'>,
): TranslationKey | null => {
  if (goal.kind === 'count' && !firstActivity(goal, activities)) {
    return 'goal_no_activities'
  }
  if (
    goal.kind === 'skill' &&
    !skills.some(skill => skill.id === goal.skillId)
  ) {
    return 'goal_skill_missing'
  }
  return null
}
