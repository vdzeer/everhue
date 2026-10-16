import type { Activity, Goal, GoalEntry, Log, Skill } from '~/core'
import { APP_NAME } from '~/services/brand'

/** Raised when the shape of the file changes, so a reader can tell. */
export const EXPORT_VERSION = 1

export type ExportSource = {
  skills: Skill[]
  activities: Activity[]
  logs: Log[]
  goals: Goal[]
  entries: GoalEntry[]
}

type Stored = { ownerUid: string; createdAt: number }

type Portable<Model extends Stored> = Omit<Model, 'ownerUid' | 'createdAt'> & {
  createdAt: string
}

/**
 * A record as it leaves the app: without the account id, which means nothing
 * outside it, and with the creation time as a date a person can read.
 */
const portable = <Model extends Stored>(model: Model) =>
  ({
    ...Object.fromEntries(
      Object.entries(model).filter(
        ([key]) => key !== 'ownerUid' && key !== 'createdAt',
      ),
    ),
    createdAt: new Date(model.createdAt).toISOString(),
  }) as Portable<Model>

/**
 * Everything stored for the user, in one object. XP, levels and streaks are
 * not in it: they are not stored either, they follow from the logs.
 */
export const buildExport = (source: ExportSource, exportedAt: Date) => ({
  app: APP_NAME,
  version: EXPORT_VERSION,
  exportedAt: exportedAt.toISOString(),
  skills: source.skills.map(portable),
  activities: source.activities.map(portable),
  logs: source.logs.map(portable),
  goals: source.goals.map(portable),
  goalEntries: source.entries.map(portable),
})

const NEEDS_QUOTES = /[",\r\n]/
/** A spreadsheet would run a cell that starts like this as a formula. */
const LOOKS_LIKE_FORMULA = /^[=+\-@\t\r]/

const cell = (value: string | number) => {
  const text = String(value)
  const safe =
    typeof value === 'string' && LOOKS_LIKE_FORMULA.test(text)
      ? `'${text}`
      : text
  return NEEDS_QUOTES.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

const CSV_HEADER = [
  'day',
  'activity',
  'part',
  'skill',
  'kind',
  'value',
  'unit',
  'effort_minutes',
  'source',
  'xp',
]

/**
 * The logs as a table for a spreadsheet, oldest first. Names are written out,
 * because an id says nothing there; a deleted activity leaves its cell empty.
 */
export const logsCsv = (
  {
    logs,
    activities,
    skills,
  }: Pick<ExportSource, 'logs' | 'activities' | 'skills'>,
  xpByLog: Record<string, number>,
) => {
  const rows = [...logs]
    .sort(
      (a, b) =>
        a.day.localeCompare(b.day) ||
        a.createdAt - b.createdAt ||
        a.id.localeCompare(b.id),
    )
    .map(log => {
      const activity = activities.find(item => item.id === log.activityId)
      const unit = () => {
        if (log.kind === 'time') return 'min'
        if (log.kind === 'count') return activity?.unit ?? ''
        return ''
      }

      return [
        log.day,
        activity?.name ?? '',
        activity?.parts.find(part => part.id === log.partId)?.name ?? '',
        skills.find(skill => skill.id === log.skillId)?.name ?? '',
        log.kind,
        log.value,
        unit(),
        log.effortMinutes,
        log.source,
        xpByLog[log.id] ?? 0,
      ]
    })

  return [CSV_HEADER, ...rows].map(row => row.map(cell).join(',')).join('\r\n')
}

/** `everhue-2026-10-12.json` */
export const exportFileName = (day: string, extension: 'json' | 'csv') =>
  `${APP_NAME.toLowerCase()}-${day}.${extension}`

/** A byte-order mark: without it Excel reads Ukrainian text as gibberish. */
const BOM = '﻿'

/** Hands a text file to the browser's own "save" flow. Browser only. */
export const saveTextFile = (name: string, mime: string, text: string) => {
  const url = URL.createObjectURL(
    new Blob([mime === 'text/csv' ? BOM + text : text], {
      type: `${mime};charset=utf-8`,
    }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
