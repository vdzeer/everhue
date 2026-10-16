import { goalLogId } from './goals'
import type { DayKey, GoalEntry, Log } from './types'

export type HistoryLog = { log: Log; xp: number }
export type HistoryEntry = { entry: GoalEntry; xp: number }

export type HistoryDay = {
  day: DayKey
  /** Effort of the day's activity logs. */
  minutes: number
  xp: number
  logs: HistoryLog[]
  entries: HistoryEntry[]
}

const byCreated = <Item extends { createdAt: number; id: string }>(
  a: Item,
  b: Item,
) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)

/**
 * The journal: every day with something recorded, newest first, and within a
 * day in the order it happened. `xpByLog` comes from `computeXp` run over the
 * logs together with the contribution stand-ins.
 */
export const buildHistory = (
  logs: Log[],
  entries: GoalEntry[],
  xpByLog: Record<string, number>,
): HistoryDay[] => {
  const days = [
    ...new Set([...logs.map(log => log.day), ...entries.map(item => item.day)]),
  ].sort((a, b) => b.localeCompare(a))

  return days.map(day => {
    const dayLogs = logs
      .filter(log => log.day === day)
      .sort(byCreated)
      .map(log => ({ log, xp: xpByLog[log.id] ?? 0 }))

    // A day's contributions to one goal earn XP once; it is shown on the
    // first of them.
    const rewarded = new Set<string>()
    const dayEntries = entries
      .filter(entry => entry.day === day)
      .sort(byCreated)
      .map(entry => {
        const key = goalLogId(entry.goalId, day)
        const earns = entry.amount > 0 && !rewarded.has(key)
        if (earns) rewarded.add(key)
        return { entry, xp: earns ? (xpByLog[key] ?? 0) : 0 }
      })

    return {
      day,
      minutes: dayLogs.reduce(
        (total, item) => total + item.log.effortMinutes,
        0,
      ),
      xp:
        dayLogs.reduce((total, item) => total + item.xp, 0) +
        dayEntries.reduce((total, item) => total + item.xp, 0),
      logs: dayLogs,
      entries: dayEntries,
    }
  })
}
