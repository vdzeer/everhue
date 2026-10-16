import {
  makeActivity,
  makeEntry,
  makeGoal,
  makeLog,
  makeSkill,
} from '~/core/__tests__/fixtures'

import {
  EXPORT_VERSION,
  buildExport,
  exportFileName,
  logsCsv,
} from '../exportData'

const skill = makeSkill({ id: 'languages', name: 'Languages' })
const activity = makeActivity({
  id: 'english',
  name: 'English',
  skillId: 'languages',
  parts: [{ id: 'cards', name: 'Flashcards', target: 5 }],
})
const createdAt = Date.UTC(2026, 9, 12, 8, 30)

describe('buildExport', () => {
  const source = {
    skills: [skill],
    activities: [activity],
    logs: [makeLog({ id: 'log-a', createdAt })],
    goals: [makeGoal({ id: 'laptop' })],
    entries: [makeEntry({ id: 'entry-a', goalId: 'laptop' })],
  }
  const file = buildExport(source, new Date(Date.UTC(2026, 9, 12, 9)))

  it('says what it is and when it was made', () => {
    expect(file).toMatchObject({
      app: 'Everhue',
      version: EXPORT_VERSION,
      exportedAt: '2026-10-12T09:00:00.000Z',
    })
  })

  it('carries every kind of record', () => {
    expect(file.skills).toHaveLength(1)
    expect(file.activities).toHaveLength(1)
    expect(file.logs).toHaveLength(1)
    expect(file.goals).toHaveLength(1)
    expect(file.goalEntries).toHaveLength(1)
  })

  it('leaves the account id out of every record', () => {
    expect(JSON.stringify(file)).not.toContain('ownerUid')
    expect(JSON.stringify(file)).not.toContain('user-1')
  })

  it('writes creation times as readable dates', () => {
    expect(file.logs[0]).toMatchObject({
      id: 'log-a',
      createdAt: '2026-10-12T08:30:00.000Z',
    })
  })

  it('is plain data: it survives being written and read back', () => {
    expect(JSON.parse(JSON.stringify(file))).toEqual(file)
  })
})

describe('logsCsv', () => {
  const lines = (logs: ReturnType<typeof makeLog>[], xp = {}) =>
    logsCsv({ logs, activities: [activity], skills: [skill] }, xp).split('\r\n')

  it('starts with a header row', () => {
    expect(lines([])).toEqual([
      'day,activity,part,skill,kind,value,unit,effort_minutes,source,xp',
    ])
  })

  it('writes names instead of ids, and the XP each log earned', () => {
    const log = makeLog({
      id: 'log-a',
      activityId: 'english',
      skillId: 'languages',
      partId: 'cards',
      day: '2026-10-12',
      value: 15,
      effortMinutes: 15,
      source: 'timer',
    })

    expect(lines([log], { 'log-a': 18 })[1]).toBe(
      '2026-10-12,English,Flashcards,Languages,time,15,min,15,timer,18',
    )
  })

  it('lists the oldest day first', () => {
    const logs = [
      makeLog({ day: '2026-10-12' }),
      makeLog({ day: '2026-10-01' }),
      makeLog({ day: '2026-10-05' }),
    ]

    expect(
      lines(logs)
        .slice(1)
        .map(line => line.slice(0, 10)),
    ).toEqual(['2026-10-01', '2026-10-05', '2026-10-12'])
  })

  it('leaves the name empty for a deleted activity', () => {
    const log = makeLog({
      activityId: 'gone',
      skillId: 'gone',
      day: '2026-10-12',
    })

    expect(lines([log])[1]).toBe('2026-10-12,,,,time,10,min,10,manual,0')
  })

  it('quotes a name with a comma or a quote in it', () => {
    const tricky = makeActivity({ id: 'tricky', name: 'Read "Dune", part 2' })
    const log = makeLog({ activityId: 'tricky', day: '2026-10-12' })
    const csv = logsCsv({ logs: [log], activities: [tricky], skills: [] }, {})

    expect(csv.split('\r\n')[1]).toContain('"Read ""Dune"", part 2"')
  })

  it('defuses a name a spreadsheet would run as a formula', () => {
    const formula = makeActivity({ id: 'formula', name: '=HYPERLINK("x")' })
    const log = makeLog({ activityId: 'formula', day: '2026-10-12' })
    const csv = logsCsv({ logs: [log], activities: [formula], skills: [] }, {})

    expect(csv.split('\r\n')[1].split(',')[1].startsWith(`"'=`)).toBe(true)
  })

  it('writes the unit of a counted activity and none for a yes-or-no one', () => {
    const reading = makeActivity({
      id: 'reading',
      kind: 'count',
      unit: 'pages',
    })
    const logs = [
      makeLog({
        activityId: 'reading',
        kind: 'count',
        value: 20,
        createdAt: 1,
      }),
      makeLog({ activityId: 'bed', kind: 'check', value: 1, createdAt: 2 }),
    ]
    const csv = logsCsv({ logs, activities: [reading], skills: [] }, {})
    const [, counted, checked] = csv.split('\r\n')

    expect(counted.split(',')[6]).toBe('pages')
    expect(checked.split(',')[6]).toBe('')
  })
})

describe('exportFileName', () => {
  it('names the file after the app and the day', () => {
    expect(exportFileName('2026-10-12', 'json')).toBe('everhue-2026-10-12.json')
    expect(exportFileName('2026-10-12', 'csv')).toBe('everhue-2026-10-12.csv')
  })
})
