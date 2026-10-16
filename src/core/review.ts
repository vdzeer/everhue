import {
  addDays,
  dayKey,
  daysBetween,
  weekDays,
  weekStart,
  weekdayOf,
} from './days'
import { SKILL_LEVEL_COEFF, levelForXp } from './levels'
import { completedOn } from './quests'
import { effortByDay } from './stats'
import type { Activity, DayKey, Log, Skill } from './types'
import { computeXp } from './xp'

export type ReviewDay = {
  day: DayKey
  minutes: number
  /** Still ahead: only in the current week. */
  future: boolean
}

export type SkillReview = {
  skill: Skill
  /** XP earned during the week. */
  xp: number
  levelBefore: number
  levelAfter: number
}

export type ActivityReview = {
  activity: Activity
  skill: Skill | undefined
  /** How many times the week has asked for it so far. */
  due: number
  /** How many of those it was done. */
  done: number
  /** 0…1 */
  ratio: number
}

export type WeekReview = {
  /** Monday and Sunday of the week. */
  start: DayKey
  end: DayKey
  /** The current week is still running. */
  current: boolean
  days: ReviewDay[]
  minutes: number
  /** The same for the week before, to compare with. */
  previousMinutes: number
  xp: number
  activeDays: number
  /** Days of the week that have already come. */
  daysSoFar: number
  bestDay: ReviewDay | null
  /** Skills that earned XP, the biggest gain first. */
  skills: SkillReview[]
  /** Asked for and not done in full, the furthest behind first. */
  behind: ActivityReview[]
  /** Done every time the week asked. */
  onTrack: ActivityReview[]
}

const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0)

/** The days among `days` on which doing the activity counts for the week. */
const countingDays = (activity: Activity, days: DayKey[]) => {
  const { schedule } = activity
  return schedule.type === 'weekdays'
    ? days.filter(day => schedule.days.includes(weekdayOf(day)))
    : days
}

/**
 * How often a week asks for an activity over `days`. An "N times a week"
 * activity is spread evenly, so one done by Wednesday is not behind yet.
 */
const dueOver = (activity: Activity, days: DayKey[]) => {
  const { schedule } = activity
  if (schedule.type === 'weekly') {
    return Math.min(
      schedule.times,
      Math.ceil((schedule.times * days.length) / 7),
    )
  }
  return countingDays(activity, days).length
}

const reviewActivity = (
  activity: Activity,
  skills: Skill[],
  logs: Log[],
  counted: DayKey[],
): ActivityReview => {
  // An activity cannot be behind on days before it existed. Its first log
  // counts as its start too: something added today may be logged for Monday.
  const own = logs.filter(log => log.activityId === activity.id)
  const created = dayKey(new Date(activity.createdAt))
  const since = [created, ...own.map(log => log.day)].sort()[0]
  const days = counted.filter(day => day >= since)

  const due = dueOver(activity, days)
  const done = Math.min(
    due,
    countingDays(activity, days).filter(day => completedOn(activity, own, day))
      .length,
  )

  return {
    activity,
    skill: skills.find(skill => skill.id === activity.skillId),
    due,
    done,
    ratio: due > 0 ? done / due : 0,
  }
}

/**
 * One week, looked back on. `logs` are what was logged against activities;
 * `xpLogs` add the contributions to goals, which earn XP and count as effort.
 */
export const buildWeekReview = (
  activities: Activity[],
  skills: Skill[],
  logs: Log[],
  xpLogs: Log[],
  today: DayKey,
  anyDayOfWeek: DayKey,
): WeekReview => {
  const start = weekStart(anyDayOfWeek)
  const week = weekDays(start)
  const end = week[6]
  const current = start === weekStart(today)
  const counted = week.filter(day => daysBetween(day, today) >= 0)

  const effort = effortByDay(xpLogs)
  const days = week.map(day => ({
    day,
    minutes: effort[day] ?? 0,
    future: daysBetween(day, today) < 0,
  }))
  const past = days.filter(day => !day.future)

  const xp = computeXp(xpLogs)
  const xpOf = (keep: (log: Log) => boolean, skillId?: string) =>
    sum(
      xpLogs
        .filter(log => keep(log) && (!skillId || log.skillId === skillId))
        .map(log => xp.byLog[log.id] ?? 0),
    )
  const inWeek = (log: Log) => log.day >= start && log.day <= end
  const before = (log: Log) => log.day < start

  const reviewed = activities
    .filter(activity => !activity.archived)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .map(activity => reviewActivity(activity, skills, logs, counted))
    .filter(item => item.due > 0)

  const best = [...past].sort(
    (a, b) => b.minutes - a.minutes || a.day.localeCompare(b.day),
  )[0]

  return {
    start,
    end,
    current,
    days,
    minutes: sum(past.map(day => day.minutes)),
    previousMinutes: sum(
      weekDays(addDays(start, -7)).map(day => effort[day] ?? 0),
    ),
    xp: xpOf(inWeek),
    activeDays: past.filter(day => day.minutes > 0).length,
    daysSoFar: counted.length,
    bestDay: best && best.minutes > 0 ? best : null,
    skills: skills
      .map(skill => {
        const earlier = xpOf(before, skill.id)
        const gained = xpOf(inWeek, skill.id)
        return {
          skill,
          xp: gained,
          levelBefore: levelForXp(earlier, SKILL_LEVEL_COEFF),
          levelAfter: levelForXp(earlier + gained, SKILL_LEVEL_COEFF),
        }
      })
      .filter(item => item.xp > 0)
      .sort((a, b) => b.xp - a.xp || a.skill.createdAt - b.skill.createdAt),
    behind: reviewed
      .filter(item => item.ratio < 1)
      .sort((a, b) => a.ratio - b.ratio),
    onTrack: reviewed.filter(item => item.ratio >= 1),
  }
}
