import { daysBetween, monthKey, monthsThrough } from './days'
import { SKILL_LEVEL_COEFF, levelForXp, xpForLevel } from './levels'
import type { DayKey, Goal, GoalEntry, Log } from './types'

/**
 * What a day with a contribution is worth to the linked skill. It is fixed:
 * XP rewards the habit of putting money aside, never the amount, so a bigger
 * income does not level faster and there is nothing to gain from a made-up sum.
 */
export const CONTRIBUTION_EFFORT_MINUTES = 20

export const goalLogId = (goalId: string, day: DayKey) =>
  `goal:${goalId}:${day}`

/**
 * Contributions as the XP engine sees them: one stand-in log per goal per day
 * with money put in, for goals linked to a skill. Splitting one payment into
 * ten earns nothing extra. They are derived, never stored.
 */
export const contributionLogs = (
  goals: Goal[],
  entries: GoalEntry[],
): Log[] => {
  const linked = new Map(
    goals
      .filter(goal => goal.kind === 'money' && goal.skillId !== '')
      .map(goal => [goal.id, goal]),
  )
  const firstOfDay = new Map<string, GoalEntry>()

  entries
    .filter(entry => entry.amount > 0 && linked.has(entry.goalId))
    .forEach(entry => {
      const key = goalLogId(entry.goalId, entry.day)
      const known = firstOfDay.get(key)
      if (!known || entry.createdAt < known.createdAt) {
        firstOfDay.set(key, entry)
      }
    })

  return [...firstOfDay.entries()].map(([id, entry]) => ({
    id,
    ownerUid: entry.ownerUid,
    activityId: `goal:${entry.goalId}`,
    skillId: (linked.get(entry.goalId) as Goal).skillId,
    day: entry.day,
    kind: 'check',
    value: 1,
    effortMinutes: CONTRIBUTION_EFFORT_MINUTES,
    source: 'manual',
    partId: '',
    createdAt: entry.createdAt,
  }))
}

export type GoalSources = {
  /** Activity logs only, without the stand-ins above. */
  logs: Log[]
  entries: GoalEntry[]
  xpBySkill: Record<string, number>
}

export type GoalProgress = {
  goal: Goal
  /** In the goal's own measure: units, level, steps or money. */
  done: number
  target: number
  /** 0…1, capped. */
  ratio: number
  complete: boolean
  /** Days until the deadline, negative once it has passed; null without one. */
  daysLeft: number | null
  /** The deadline has passed and the goal is not reached. */
  overdue: boolean
  money: {
    /** Put in, less taken out, during the current calendar month. */
    monthIn: number
    /**
     * What every month from this one to the deadline has to bring in. Null
     * without a deadline, after it, or once the goal is reached.
     */
    monthlyNeeded: number | null
  } | null
}

const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0)

const clamp = (ratio: number) => Math.min(1, Math.max(0, ratio))

const measure = (goal: Goal, sources: GoalSources) => {
  if (goal.kind === 'count') {
    const done = sum(
      sources.logs
        .filter(
          log =>
            goal.activityIds.includes(log.activityId) &&
            log.day >= goal.startDay,
        )
        .map(log => log.value),
    )
    return { done, target: goal.target, ratio: done / goal.target }
  }

  if (goal.kind === 'skill') {
    const xp = sources.xpBySkill[goal.skillId] ?? 0
    return {
      done: levelForXp(xp, SKILL_LEVEL_COEFF),
      target: goal.target,
      // By XP rather than by level, so the bar moves between levels too.
      ratio: xp / xpForLevel(goal.target, SKILL_LEVEL_COEFF),
    }
  }

  if (goal.kind === 'steps') {
    const done = goal.steps.filter(step => step.done).length
    const target = goal.steps.length
    return { done, target, ratio: target > 0 ? done / target : 0 }
  }

  const done = sum(
    sources.entries
      .filter(entry => entry.goalId === goal.id)
      .map(entry => entry.amount),
  )
  return { done, target: goal.target, ratio: done / goal.target }
}

export const goalProgress = (
  goal: Goal,
  sources: GoalSources,
  today: DayKey,
): GoalProgress => {
  const { done, target, ratio } = measure(goal, sources)
  const complete = target > 0 && done >= target
  const daysLeft = goal.deadline ? daysBetween(today, goal.deadline) : null
  const canStillMakeIt = daysLeft !== null && daysLeft >= 0 && !complete

  return {
    goal,
    done,
    target,
    ratio: clamp(ratio),
    complete,
    daysLeft,
    overdue: daysLeft !== null && daysLeft < 0 && !complete,
    money:
      goal.kind === 'money'
        ? {
            monthIn: sum(
              sources.entries
                .filter(
                  entry =>
                    entry.goalId === goal.id &&
                    monthKey(entry.day) === monthKey(today),
                )
                .map(entry => entry.amount),
            ),
            monthlyNeeded: canStillMakeIt
              ? (target - done) /
                Math.max(1, monthsThrough(today, goal.deadline))
              : null,
          }
        : null,
  }
}

export type GoalsView = {
  /** Still being worked on: the nearest deadline first. */
  active: GoalProgress[]
  /** Reached, and not put away yet. */
  reached: GoalProgress[]
  archived: GoalProgress[]
}

const byDeadline = (a: GoalProgress, b: GoalProgress) => {
  // A goal with a deadline comes before one without.
  const one = a.goal.deadline || '9999-12-31'
  const other = b.goal.deadline || '9999-12-31'
  return (
    one.localeCompare(other) ||
    a.goal.createdAt - b.goal.createdAt ||
    a.goal.id.localeCompare(b.goal.id)
  )
}

/** Everything the Goals screen decides. */
export const buildGoals = (
  goals: Goal[],
  sources: GoalSources,
  today: DayKey,
): GoalsView => {
  const all = goals.map(goal => goalProgress(goal, sources, today))
  const open = all.filter(item => !item.goal.archived).sort(byDeadline)

  return {
    active: open.filter(item => !item.complete),
    reached: open.filter(item => item.complete),
    archived: all
      .filter(item => item.goal.archived)
      .sort((a, b) => b.goal.createdAt - a.goal.createdAt),
  }
}
