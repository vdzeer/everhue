import { weekdayOf, weekDays } from './days'
import type { Activity, DayKey, Log, Skill } from './types'

export type PartProgress = {
  id: string
  name: string
  target: number
  done: number
  complete: boolean
}

export type Quest = {
  activity: Activity
  /** Undefined when the skill was deleted; the quest still shows. */
  skill: Skill | undefined
  target: number
  done: number
  /** 0…1, capped. */
  ratio: number
  started: boolean
  complete: boolean
  parts: PartProgress[]
  /** Only for "N times a week" activities. */
  weekly: { times: number; completedDays: number } | null
  /** Today's logs for this activity, oldest first. The last one is the undo. */
  logIds: string[]
}

const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0)

/** An activity with parts is as big as its parts add up to. */
export const dailyTarget = (activity: Activity) =>
  activity.parts.length > 0
    ? sum(activity.parts.map(part => part.target))
    : activity.target

const logsFor = (logs: Log[], activityId: string, day: DayKey) =>
  logs
    .filter(log => log.activityId === activityId && log.day === day)
    .sort((a, b) => a.createdAt - b.createdAt)

const doneOn = (activity: Activity, logs: Log[], day: DayKey) =>
  sum(logsFor(logs, activity.id, day).map(log => log.value))

/** Was the activity's daily target met on `day`? */
export const completedOn = (activity: Activity, logs: Log[], day: DayKey) =>
  doneOn(activity, logs, day) >= dailyTarget(activity)

/** Days of `day`'s week on which the activity's daily target was met. */
const completedDaysInWeek = (activity: Activity, logs: Log[], day: DayKey) =>
  weekDays(day).filter(weekDay => completedOn(activity, logs, weekDay)).length

/**
 * Does the activity ask for anything on `day`? A weekly activity is offered
 * every day until its weekly count is reached.
 */
export const isDueOn = (activity: Activity, logs: Log[], day: DayKey) => {
  if (activity.archived) return false

  const { schedule } = activity
  if (schedule.type === 'weekdays') {
    return schedule.days.includes(weekdayOf(day))
  }
  if (schedule.type === 'weekly') {
    const doneToday = completedOn(activity, logs, day)
    return (
      doneToday || completedDaysInWeek(activity, logs, day) < schedule.times
    )
  }
  return true
}

const buildQuest = (
  activity: Activity,
  skills: Skill[],
  logs: Log[],
  day: DayKey,
): Quest => {
  const todays = logsFor(logs, activity.id, day)
  const target = dailyTarget(activity)
  const done = sum(todays.map(log => log.value))

  const parts = activity.parts.map(part => {
    const partDone = sum(
      todays.filter(log => log.partId === part.id).map(log => log.value),
    )
    return {
      id: part.id,
      name: part.name,
      target: part.target,
      done: partDone,
      complete: partDone >= part.target,
    }
  })

  return {
    activity,
    skill: skills.find(skill => skill.id === activity.skillId),
    target,
    done,
    ratio: target > 0 ? Math.min(1, done / target) : 0,
    started: done > 0,
    complete: done >= target,
    parts,
    weekly:
      activity.schedule.type === 'weekly'
        ? {
            times: activity.schedule.times,
            completedDays: completedDaysInWeek(activity, logs, day),
          }
        : null,
    logIds: todays.map(log => log.id),
  }
}

export type TodayView = {
  pending: Quest[]
  done: Quest[]
  total: number
}

/**
 * Everything the Today screen decides: which activities are due, how far each
 * one is, and which are finished. Order follows creation, so the list does
 * not reshuffle while it is being worked through.
 */
export const buildToday = (
  activities: Activity[],
  skills: Skill[],
  logs: Log[],
  day: DayKey,
): TodayView => {
  // Nothing here looks further back than the current week, so the full log
  // history is cut down once instead of being scanned per activity.
  const week = new Set(weekDays(day))
  const recent = logs.filter(log => week.has(log.day))

  const quests = [...activities]
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .filter(activity => isDueOn(activity, recent, day))
    .map(activity => buildQuest(activity, skills, recent, day))

  return {
    pending: quests.filter(quest => !quest.complete),
    done: quests.filter(quest => quest.complete),
    total: quests.length,
  }
}

/** The part a timer should run for: the first one not yet finished. */
export const nextPart = (quest: Quest): PartProgress | null =>
  quest.parts.find(part => !part.complete) ?? null
