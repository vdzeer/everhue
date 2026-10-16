/**
 * The domain model. Everything in `src/core` is plain TypeScript with no
 * React, Next or Firebase import (a test enforces it), so the same rules can
 * later run in a Cloud Function and in the mobile app.
 */

/** A realm is a canonical id; the UI derives a colour and an icon from it. */
export const REALMS = [
  'library',
  'forge',
  'harbor',
  'neon',
  'gardens',
  'bay',
] as const
export type Realm = (typeof REALMS)[number]

export const ACTIVITY_KINDS = ['time', 'count', 'check'] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const LOG_SOURCES = ['timer', 'manual'] as const
export type LogSource = (typeof LOG_SOURCES)[number]

/** A local calendar date, `YYYY-MM-DD`. */
export type DayKey = string

export type Schedule =
  | { type: 'daily' }
  /** ISO weekdays, 1 = Monday … 7 = Sunday. */
  | { type: 'weekdays'; days: number[] }
  | { type: 'weekly'; times: number }

export type Part = {
  id: string
  name: string
  /** In the activity's own unit: minutes for `time`, items for `count`. */
  target: number
}

export type Skill = {
  id: string
  ownerUid: string
  name: string
  realm: Realm
  archived: boolean
  /** Milliseconds since the epoch. */
  createdAt: number
}

export type Activity = {
  id: string
  ownerUid: string
  name: string
  skillId: string
  kind: ActivityKind
  /** Daily target in the activity's unit. Ignored when the activity has parts. */
  target: number
  /** Free-text label for `count` activities, e.g. "pages". */
  unit: string
  /** How many minutes of effort one counted item stands for. */
  minutesPerUnit: number
  /** The effort a `check` activity is worth when ticked. */
  effortMinutes: number
  parts: Part[]
  schedule: Schedule
  archived: boolean
  createdAt: number
}

/**
 * A raw fact. XP is never stored: it is derived from these, so the formula
 * can change without a data migration.
 */
export type Log = {
  id: string
  ownerUid: string
  activityId: string
  /** Snapshot of the activity's skill, so retargeting it keeps history. */
  skillId: string
  day: DayKey
  kind: ActivityKind
  /** Minutes for `time`, items for `count`, 1 for `check`. */
  value: number
  /** Effort in minutes, fixed when the log is created. */
  effortMinutes: number
  source: LogSource
  /** Empty when the activity has no parts. */
  partId: string
  createdAt: number
}

export const GOAL_KINDS = ['count', 'skill', 'steps', 'money'] as const
/**
 * `count` adds up the logs of chosen activities, `skill` waits for a skill to
 * reach a level, `steps` is a checklist, `money` adds up contributions.
 */
export type GoalKind = (typeof GOAL_KINDS)[number]

export const CURRENCIES = ['UAH', 'USD', 'EUR', 'PLN', 'GBP'] as const
export type Currency = (typeof CURRENCIES)[number]

export type GoalStep = {
  id: string
  name: string
  done: boolean
}

export type Goal = {
  id: string
  ownerUid: string
  name: string
  kind: GoalKind
  /**
   * `count`: the total, in the unit of its activities (minutes for timed
   * ones). `skill`: the level. `money`: the amount. `steps`: 0, unused.
   */
  target: number
  /** `count` goals: the activities whose logs add up. */
  activityIds: string[]
  /**
   * `skill` goals: the skill to level. `money` goals: the skill a
   * contribution trains, or '' for none. Empty otherwise.
   */
  skillId: string
  /** `steps` goals. */
  steps: GoalStep[]
  /** `money` goals; '' otherwise. Amounts are never converted. */
  currency: Currency | ''
  /** `money` goals: what the user plans to put in each month; 0 = no plan. */
  monthlyPlan: number
  /** `count` goals: logs count from this day on. */
  startDay: DayKey
  /** '' when the goal has no deadline. */
  deadline: DayKey | ''
  archived: boolean
  createdAt: number
}

/** Money put into a goal, or taken out of it. Never edited, like a log. */
export type GoalEntry = {
  id: string
  ownerUid: string
  goalId: string
  /** Positive: put in. Negative: taken out. Never zero. */
  amount: number
  day: DayKey
  createdAt: number
}
