import { buildToday, dailyTarget, isDueOn, nextPart } from '../quests'
import { makeActivity, makeLog, makeSkill } from './fixtures'

const MONDAY = '2026-10-12'
const WEDNESDAY = '2026-10-14'

describe('dailyTarget', () => {
  it('is the activity target without parts', () => {
    expect(dailyTarget(makeActivity({ target: 45 }))).toBe(45)
  })

  it('is the sum of the parts when there are any', () => {
    const english = makeActivity({
      target: 99,
      parts: [
        { id: 'anki', name: 'Anki', target: 5 },
        { id: 'podcast', name: 'Podcast', target: 5 },
      ],
    })

    expect(dailyTarget(english)).toBe(10)
  })
})

describe('isDueOn', () => {
  it('offers a daily activity every day', () => {
    expect(isDueOn(makeActivity(), [], MONDAY)).toBe(true)
  })

  it('never offers an archived activity', () => {
    expect(isDueOn(makeActivity({ archived: true }), [], MONDAY)).toBe(false)
  })

  it('offers a weekday activity only on its days', () => {
    const warmup = makeActivity({
      schedule: { type: 'weekdays', days: [1, 3, 5] },
    })

    expect(isDueOn(warmup, [], MONDAY)).toBe(true)
    expect(isDueOn(warmup, [], '2026-10-13')).toBe(false)
    expect(isDueOn(warmup, [], WEDNESDAY)).toBe(true)
  })

  it('offers a weekly activity until its count for the week is reached', () => {
    const gym = makeActivity({
      id: 'gym',
      target: 45,
      schedule: { type: 'weekly', times: 2 },
    })
    const session = (day: string) =>
      makeLog({ activityId: 'gym', day, value: 45 })

    expect(isDueOn(gym, [session(MONDAY)], WEDNESDAY)).toBe(true)
    expect(
      isDueOn(gym, [session(MONDAY), session('2026-10-13')], WEDNESDAY),
    ).toBe(false)
  })

  it('keeps a weekly activity on the list for the day that completed it', () => {
    const gym = makeActivity({
      id: 'gym',
      target: 45,
      schedule: { type: 'weekly', times: 1 },
    })
    const logs = [makeLog({ activityId: 'gym', day: MONDAY, value: 45 })]

    expect(isDueOn(gym, logs, MONDAY)).toBe(true)
    expect(isDueOn(gym, logs, WEDNESDAY)).toBe(false)
  })

  it('does not count last week towards this week', () => {
    const gym = makeActivity({
      id: 'gym',
      target: 45,
      schedule: { type: 'weekly', times: 1 },
    })
    const lastSunday = makeLog({
      activityId: 'gym',
      day: '2026-10-11',
      value: 45,
    })

    expect(isDueOn(gym, [lastSunday], MONDAY)).toBe(true)
  })
})

describe('buildToday', () => {
  const languages = makeSkill({ id: 'languages' })
  const english = makeActivity({
    id: 'english',
    skillId: 'languages',
    createdAt: 1,
    parts: [
      { id: 'anki', name: 'Anki', target: 5 },
      { id: 'podcast', name: 'Podcast', target: 5 },
    ],
  })
  const reading = makeActivity({
    id: 'reading',
    skillId: 'missing-skill',
    kind: 'count',
    target: 20,
    createdAt: 2,
  })
  const meditation = makeActivity({
    id: 'meditation',
    target: 10,
    createdAt: 3,
  })

  it('splits quests into pending and done and tracks each part', () => {
    const logs = [
      makeLog({ activityId: 'english', partId: 'anki', value: 5 }),
      makeLog({ activityId: 'reading', kind: 'count', value: 12 }),
      makeLog({ activityId: 'meditation', value: 10 }),
      // Yesterday does not count towards today.
      makeLog({
        activityId: 'reading',
        day: '2026-10-11',
        kind: 'count',
        value: 20,
      }),
    ]

    const view = buildToday(
      [meditation, reading, english],
      [languages],
      logs,
      MONDAY,
    )

    expect(view.total).toBe(3)
    expect(view.pending.map(quest => quest.activity.id)).toEqual([
      'english',
      'reading',
    ])
    expect(view.done.map(quest => quest.activity.id)).toEqual(['meditation'])

    const [englishQuest, readingQuest] = view.pending
    expect(englishQuest).toMatchObject({
      target: 10,
      done: 5,
      ratio: 0.5,
      started: true,
      complete: false,
      weekly: null,
    })
    expect(englishQuest.skill).toBe(languages)
    expect(englishQuest.parts).toEqual([
      { id: 'anki', name: 'Anki', target: 5, done: 5, complete: true },
      { id: 'podcast', name: 'Podcast', target: 5, done: 0, complete: false },
    ])
    expect(nextPart(englishQuest)?.id).toBe('podcast')

    expect(readingQuest).toMatchObject({ done: 12, ratio: 0.6 })
    expect(readingQuest.skill).toBeUndefined()
    expect(nextPart(readingQuest)).toBeNull()
  })

  it("caps the ratio at 1 and lists today's logs oldest first", () => {
    const first = makeLog({ activityId: 'meditation', value: 10, createdAt: 5 })
    const second = makeLog({
      activityId: 'meditation',
      value: 10,
      createdAt: 9,
    })

    const [quest] = buildToday([meditation], [], [second, first], MONDAY).done

    expect(quest.ratio).toBe(1)
    expect(quest.logIds).toEqual([first.id, second.id])
  })

  it('reports weekly progress for "N times a week" activities', () => {
    const gym = makeActivity({
      id: 'gym',
      target: 45,
      schedule: { type: 'weekly', times: 3 },
    })
    const logs = [makeLog({ activityId: 'gym', day: MONDAY, value: 45 })]

    const [quest] = buildToday([gym], [], logs, WEDNESDAY).pending

    expect(quest.weekly).toEqual({ times: 3, completedDays: 1 })
    expect(quest.started).toBe(false)
  })

  it('is empty with no activities', () => {
    expect(buildToday([], [], [], MONDAY)).toEqual({
      pending: [],
      done: [],
      total: 0,
    })
  })
})
