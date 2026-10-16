import { addDays } from './days'
import { activeDays, buildStreaks } from './streaks'
import type { Activity, DayKey, Log, LogSource } from './types'

/** Time measured by the in-app timer is worth more than a typed-in number. */
export const TIMER_MULTIPLIER = 1.2
/**
 * Each day in a row before today adds 5%, up to five days. A day a freeze
 * covered keeps the row going without adding to it.
 */
export const STREAK_STEP = 0.05
export const STREAK_MAX_DAYS = 5
/** One activity earns XP for at most this much effort per day. */
export const DAILY_EFFORT_CAP_MINUTES = 240

export const sourceMultiplier = (source: LogSource) =>
  source === 'timer' ? TIMER_MULTIPLIER : 1

export const streakMultiplier = (daysBefore: number) =>
  1 + STREAK_STEP * Math.min(Math.max(daysBefore, 0), STREAK_MAX_DAYS)

/** Effort in minutes that `value` of an activity stands for. */
export const effortFor = (
  activity: Pick<Activity, 'kind' | 'minutesPerUnit' | 'effortMinutes'>,
  value: number,
) => {
  if (activity.kind === 'count') return value * activity.minutesPerUnit
  if (activity.kind === 'check') return activity.effortMinutes
  return value
}

/** XP a single log is worth before the daily cap is applied. */
export const xpForEffort = (
  effortMinutes: number,
  source: LogSource,
  streakDaysBefore: number,
) =>
  Math.round(
    effortMinutes *
      sourceMultiplier(source) *
      streakMultiplier(streakDaysBefore),
  )

export type XpSummary = {
  byLog: Record<string, number>
  bySkill: Record<string, number>
  total: number
}

const byDayThenCreated = (a: Log, b: Log) =>
  a.day.localeCompare(b.day) ||
  a.createdAt - b.createdAt ||
  a.id.localeCompare(b.id)

/**
 * XP for every log, per skill and in total. Pure and deterministic: the same
 * logs always give the same numbers, whatever order they arrive in.
 */
export const computeXp = (logs: Log[]): XpSummary => {
  const days = activeDays(logs)
  const usedEffort = new Map<string, number>()
  // One walk over the whole history, up to the last day anything was logged.
  const lastDay = [...days].sort().at(-1)
  const streaks = lastDay ? buildStreaks(days, lastDay).lengthOn : new Map()

  const streakFor = (day: DayKey): number => streaks.get(addDays(day, -1)) ?? 0

  // Filled in place rather than rebuilt per log: a few thousand logs would
  // otherwise copy the whole result a few thousand times.
  const summary: XpSummary = { byLog: {}, bySkill: {}, total: 0 }
  const ordered = [...logs].sort(byDayThenCreated)

  ordered.forEach(log => {
    const capKey = `${log.activityId}|${log.day}`
    const already = usedEffort.get(capKey) ?? 0
    const counted = Math.max(
      0,
      Math.min(log.effortMinutes, DAILY_EFFORT_CAP_MINUTES - already),
    )
    usedEffort.set(capKey, already + counted)

    const xp = xpForEffort(counted, log.source, streakFor(log.day))

    summary.byLog[log.id] = xp
    summary.bySkill[log.skillId] = (summary.bySkill[log.skillId] ?? 0) + xp
    summary.total += xp
  })

  return summary
}
