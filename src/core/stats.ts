import { addDays, daysBetween, weekDays, weekStart } from './days'
import {
  HERO_LEVEL_COEFF,
  SKILL_LEVEL_COEFF,
  levelProgress,
  type LevelProgress,
} from './levels'
import { activeDays, buildStreaks, consistency } from './streaks'
import type { DayKey, Log, Skill } from './types'
import { computeXp, type XpSummary } from './xp'

/** Effort minutes logged per day. */
export const effortByDay = (logs: Log[]): Record<DayKey, number> => {
  const totals: Record<DayKey, number> = {}
  logs.forEach(log => {
    totals[log.day] = (totals[log.day] ?? 0) + log.effortMinutes
  })
  return totals
}

export type HeatLevel = 0 | 1 | 2 | 3

/** Buckets for the activity map: nothing, a little, a solid day, a big day. */
export const heatLevel = (minutes: number): HeatLevel => {
  if (minutes <= 0) return 0
  if (minutes < 20) return 1
  if (minutes < 60) return 2
  return 3
}

export type HeatCell = {
  day: DayKey
  level: HeatLevel
  /** Days after today in the current week: drawn as empty outlines. */
  future: boolean
}

export const HEATMAP_WEEKS = 26

/**
 * Columns of seven days, Monday first; the last column is the current week.
 */
export const buildHeatmap = (
  logs: Log[],
  today: DayKey,
  weeks = HEATMAP_WEEKS,
): HeatCell[][] => {
  const effort = effortByDay(logs)
  const firstMonday = addDays(weekStart(today), -7 * (weeks - 1))

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (__, weekday) => {
      const day = addDays(firstMonday, week * 7 + weekday)
      const future = daysBetween(today, day) > 0
      return {
        day,
        level: future ? 0 : heatLevel(effort[day] ?? 0),
        future,
      }
    }),
  )
}

export type WeekDayEffort = {
  day: DayKey
  minutes: number
  isToday: boolean
}

/** Effort per day of the current week, Monday to Sunday. */
export const weekEffort = (logs: Log[], today: DayKey): WeekDayEffort[] => {
  const effort = effortByDay(logs)
  return weekDays(today).map(day => ({
    day,
    minutes: effort[day] ?? 0,
    isToday: day === today,
  }))
}

export type SkillStanding = {
  skill: Skill
  progress: LevelProgress
}

export type HeroView = {
  xp: XpSummary
  hero: LevelProgress
  skills: SkillStanding[]
  streak: number
  /** Streak freezes in hand. */
  freezes: number
  /** Yesterday had nothing logged and a freeze kept the streak. */
  frozenYesterday: boolean
  /** 0…1 */
  consistency: number
  weekMinutes: number
}

/** Everything the Hero screen and the hero card show, from the raw logs. */
export const buildHero = (
  skills: Skill[],
  logs: Log[],
  today: DayKey,
): HeroView => {
  const xp = computeXp(logs)
  const days = activeDays(logs)
  const streaks = buildStreaks(days, today, true)

  return {
    xp,
    hero: levelProgress(xp.total, HERO_LEVEL_COEFF),
    skills: skills
      .filter(skill => !skill.archived)
      .map(skill => ({
        skill,
        progress: levelProgress(xp.bySkill[skill.id] ?? 0, SKILL_LEVEL_COEFF),
      }))
      .sort(
        (a, b) =>
          b.progress.xp - a.progress.xp ||
          a.skill.createdAt - b.skill.createdAt,
      ),
    streak: streaks.lengthOn.get(today) ?? 0,
    freezes: streaks.bank,
    frozenYesterday: streaks.frozen.has(addDays(today, -1)),
    consistency: consistency(days, today),
    weekMinutes: weekEffort(logs, today).reduce(
      (total, day) => total + day.minutes,
      0,
    ),
  }
}
