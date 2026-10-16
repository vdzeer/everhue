import {
  ACTIVITY_KINDS,
  CURRENCIES,
  GOAL_KINDS,
  LOG_SOURCES,
  REALMS,
  isDayKey,
  type Activity,
  type ActivityKind,
  type Currency,
  type Goal,
  type GoalEntry,
  type GoalKind,
  type GoalStep,
  type Log,
  type LogSource,
  type Part,
  type Realm,
  type Schedule,
  type Skill,
} from '~/core'

/**
 * The boundary between Firestore documents (snake_case, untrusted) and the
 * domain model. A document that does not match the shape is dropped rather
 * than half-read: the rules already refuse to store one, so a mismatch means
 * something older or foreign, and guessing its meaning would be worse than
 * not showing it.
 *
 * This file imports nothing from Firebase, so it is tested without it.
 */

type Doc = Record<string, unknown>

const isString = (value: unknown): value is string => typeof value === 'string'
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean'
const oneOf = <Value extends string>(
  options: readonly Value[],
  value: unknown,
): value is Value => isString(value) && options.includes(value as Value)

/** A Firestore Timestamp, or anything else with the same method. */
const toMillis = (value: unknown, fallback: number) => {
  const stamp = value as { toMillis?: () => number } | null
  return stamp && typeof stamp.toMillis === 'function'
    ? stamp.toMillis()
    : fallback
}

// ---- skills ---------------------------------------------------------------

export const skillFromDoc = (
  id: string,
  data: Doc,
  now: number,
): Skill | null => {
  if (
    !isString(data.owner_uid) ||
    !isString(data.name) ||
    !oneOf<Realm>(REALMS, data.realm) ||
    !isBoolean(data.archived)
  ) {
    return null
  }

  return {
    id,
    ownerUid: data.owner_uid,
    name: data.name,
    realm: data.realm,
    archived: data.archived,
    createdAt: toMillis(data.created_at, now),
  }
}

/**
 * Every stored field but `created_at`: the writer adds `serverTimestamp()` to
 * a new document and leaves it out of an edit, because the rules accept only
 * the server's clock on create and the stored value afterwards.
 */
export const skillToDoc = (skill: Skill) => ({
  owner_uid: skill.ownerUid,
  name: skill.name,
  realm: skill.realm,
  archived: skill.archived,
})

// ---- activities -----------------------------------------------------------

const partFromDoc = (value: unknown): Part | null => {
  const part = value as Doc | null
  if (
    !part ||
    !isString(part.id) ||
    !isString(part.name) ||
    !isNumber(part.target) ||
    part.target <= 0
  ) {
    return null
  }
  return { id: part.id, name: part.name, target: part.target }
}

const scheduleFromDoc = (value: unknown): Schedule | null => {
  const schedule = value as Doc | null
  if (!schedule) return null

  if (schedule.type === 'daily') return { type: 'daily' }

  if (schedule.type === 'weekdays' && Array.isArray(schedule.days)) {
    const days = schedule.days.filter(
      (day): day is number => Number.isInteger(day) && day >= 1 && day <= 7,
    )
    return days.length > 0 ? { type: 'weekdays', days } : null
  }

  if (
    schedule.type === 'weekly' &&
    isNumber(schedule.times) &&
    Number.isInteger(schedule.times) &&
    schedule.times >= 1 &&
    schedule.times <= 7
  ) {
    return { type: 'weekly', times: schedule.times }
  }

  return null
}

export const activityFromDoc = (
  id: string,
  data: Doc,
  now: number,
): Activity | null => {
  const schedule = scheduleFromDoc(data.schedule)
  const parts = Array.isArray(data.parts) ? data.parts.map(partFromDoc) : null

  if (
    !isString(data.owner_uid) ||
    !isString(data.name) ||
    !isString(data.skill_id) ||
    !oneOf<ActivityKind>(ACTIVITY_KINDS, data.kind) ||
    !isNumber(data.target) ||
    !isString(data.unit) ||
    !isNumber(data.minutes_per_unit) ||
    !isNumber(data.effort_minutes) ||
    !isBoolean(data.archived) ||
    !schedule ||
    !parts ||
    parts.some(part => part === null)
  ) {
    return null
  }

  return {
    id,
    ownerUid: data.owner_uid,
    name: data.name,
    skillId: data.skill_id,
    kind: data.kind,
    target: data.target,
    unit: data.unit,
    minutesPerUnit: data.minutes_per_unit,
    effortMinutes: data.effort_minutes,
    parts: parts as Part[],
    schedule,
    archived: data.archived,
    createdAt: toMillis(data.created_at, now),
  }
}

export const activityToDoc = (activity: Activity) => ({
  owner_uid: activity.ownerUid,
  name: activity.name,
  skill_id: activity.skillId,
  kind: activity.kind,
  target: activity.target,
  unit: activity.unit,
  minutes_per_unit: activity.minutesPerUnit,
  effort_minutes: activity.effortMinutes,
  parts: activity.parts.map(part => ({
    id: part.id,
    name: part.name,
    target: part.target,
  })),
  schedule: activity.schedule,
  archived: activity.archived,
})

// ---- logs -----------------------------------------------------------------

export const logFromDoc = (id: string, data: Doc, now: number): Log | null => {
  if (
    !isString(data.owner_uid) ||
    !isString(data.activity_id) ||
    !isString(data.skill_id) ||
    !isDayKey(data.day) ||
    !oneOf<ActivityKind>(ACTIVITY_KINDS, data.kind) ||
    !isNumber(data.value) ||
    !isNumber(data.effort_minutes) ||
    !oneOf<LogSource>(LOG_SOURCES, data.source) ||
    !isString(data.part_id)
  ) {
    return null
  }

  return {
    id,
    ownerUid: data.owner_uid,
    activityId: data.activity_id,
    skillId: data.skill_id,
    day: data.day,
    kind: data.kind,
    value: data.value,
    effortMinutes: data.effort_minutes,
    source: data.source,
    partId: data.part_id,
    createdAt: toMillis(data.created_at, now),
  }
}

export const logToDoc = (log: Log) => ({
  owner_uid: log.ownerUid,
  activity_id: log.activityId,
  skill_id: log.skillId,
  day: log.day,
  kind: log.kind,
  value: log.value,
  effort_minutes: log.effortMinutes,
  source: log.source,
  part_id: log.partId,
})

// ---- goals ----------------------------------------------------------------

const stepFromDoc = (value: unknown): GoalStep | null => {
  const step = value as Doc | null
  if (
    !step ||
    !isString(step.id) ||
    !isString(step.name) ||
    !isBoolean(step.done)
  ) {
    return null
  }
  return { id: step.id, name: step.name, done: step.done }
}

export const goalFromDoc = (
  id: string,
  data: Doc,
  now: number,
): Goal | null => {
  const steps = Array.isArray(data.steps) ? data.steps.map(stepFromDoc) : null
  const activityIds = Array.isArray(data.activity_ids)
    ? data.activity_ids
    : null

  if (
    !isString(data.owner_uid) ||
    !isString(data.name) ||
    !oneOf<GoalKind>(GOAL_KINDS, data.kind) ||
    !isNumber(data.target) ||
    !activityIds ||
    !activityIds.every(isString) ||
    !isString(data.skill_id) ||
    !steps ||
    steps.some(step => step === null) ||
    !(data.currency === '' || oneOf<Currency>(CURRENCIES, data.currency)) ||
    !isNumber(data.monthly_plan) ||
    !isDayKey(data.start_day) ||
    !(data.deadline === '' || isDayKey(data.deadline)) ||
    !isBoolean(data.archived)
  ) {
    return null
  }

  return {
    id,
    ownerUid: data.owner_uid,
    name: data.name,
    kind: data.kind,
    target: data.target,
    activityIds,
    skillId: data.skill_id,
    steps: steps as GoalStep[],
    currency: data.currency,
    monthlyPlan: data.monthly_plan,
    startDay: data.start_day,
    deadline: data.deadline,
    archived: data.archived,
    createdAt: toMillis(data.created_at, now),
  }
}

export const goalToDoc = (goal: Goal) => ({
  owner_uid: goal.ownerUid,
  name: goal.name,
  kind: goal.kind,
  target: goal.target,
  activity_ids: [...goal.activityIds],
  skill_id: goal.skillId,
  steps: goal.steps.map(step => ({
    id: step.id,
    name: step.name,
    done: step.done,
  })),
  currency: goal.currency,
  monthly_plan: goal.monthlyPlan,
  start_day: goal.startDay,
  deadline: goal.deadline,
  archived: goal.archived,
})

export const goalEntryFromDoc = (
  id: string,
  data: Doc,
  now: number,
): GoalEntry | null => {
  if (
    !isString(data.owner_uid) ||
    !isString(data.goal_id) ||
    !isNumber(data.amount) ||
    data.amount === 0 ||
    !isDayKey(data.day)
  ) {
    return null
  }

  return {
    id,
    ownerUid: data.owner_uid,
    goalId: data.goal_id,
    amount: data.amount,
    day: data.day,
    createdAt: toMillis(data.created_at, now),
  }
}

export const goalEntryToDoc = (entry: GoalEntry) => ({
  owner_uid: entry.ownerUid,
  goal_id: entry.goalId,
  amount: entry.amount,
  day: entry.day,
})
