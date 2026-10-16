import {
  makeActivity,
  makeEntry,
  makeGoal,
  makeLog,
  makeSkill,
} from '~/core/__tests__/fixtures'

import {
  activityFromDoc,
  activityToDoc,
  goalEntryFromDoc,
  goalEntryToDoc,
  goalFromDoc,
  goalToDoc,
  logFromDoc,
  logToDoc,
  skillFromDoc,
  skillToDoc,
} from '../firestoreMappers'

const NOW = 1_800_000_000_000
/** Stands in for a Firestore Timestamp. */
const stamp = (millis: number) => ({ toMillis: () => millis })

describe('skills', () => {
  const skill = makeSkill({ id: 'skill-1', createdAt: 5 })

  it('survives a round trip', () => {
    const doc = { ...skillToDoc(skill), created_at: stamp(5) }

    expect(skillFromDoc('skill-1', doc, NOW)).toEqual(skill)
  })

  it('stores snake_case fields and nothing else; the writer adds created_at', () => {
    expect(Object.keys(skillToDoc(skill)).sort()).toEqual([
      'archived',
      'name',
      'owner_uid',
      'realm',
    ])
  })

  it('uses the current time while the server timestamp is still pending', () => {
    const doc = { ...skillToDoc(skill), created_at: null }

    expect(skillFromDoc('skill-1', doc, NOW)?.createdAt).toBe(NOW)
  })

  it.each([
    ['an unknown realm', { realm: 'swamp' }],
    ['a missing owner', { owner_uid: undefined }],
    ['a name that is not text', { name: 42 }],
    ['an archived flag that is not a boolean', { archived: 'no' }],
  ])('drops a document with %s', (_, broken) => {
    const doc = { ...skillToDoc(skill), created_at: stamp(5), ...broken }

    expect(skillFromDoc('skill-1', doc, NOW)).toBeNull()
  })
})

describe('activities', () => {
  const activity = makeActivity({
    id: 'activity-1',
    createdAt: 7,
    kind: 'count',
    target: 20,
    unit: 'pages',
    minutesPerUnit: 1.5,
    parts: [{ id: 'part-1', name: 'Morning', target: 10 }],
    schedule: { type: 'weekdays', days: [1, 3, 5] },
  })

  it('survives a round trip', () => {
    const doc = { ...activityToDoc(activity), created_at: stamp(7) }

    expect(activityFromDoc('activity-1', doc, NOW)).toEqual(activity)
  })

  it.each([
    [{ type: 'daily' }],
    [{ type: 'weekdays', days: [2, 7] }],
    [{ type: 'weekly', times: 3 }],
  ] as const)('reads the schedule %j', schedule => {
    const doc = { ...activityToDoc(activity), created_at: stamp(7), schedule }

    expect(activityFromDoc('activity-1', doc, NOW)?.schedule).toEqual(schedule)
  })

  it.each([
    ['an unknown kind', { kind: 'vibes' }],
    ['an unknown schedule', { schedule: { type: 'monthly' } }],
    ['a weekly count above seven', { schedule: { type: 'weekly', times: 9 } }],
    ['no weekdays at all', { schedule: { type: 'weekdays', days: [] } }],
    ['parts that are not a list', { parts: 'none' }],
    ['a part without a target', { parts: [{ id: 'p', name: 'Part' }] }],
    [
      'a part with a zero target',
      { parts: [{ id: 'p', name: 'P', target: 0 }] },
    ],
    ['a target that is not a number', { target: '20' }],
    ['a target that is not finite', { target: Number.NaN }],
  ])('drops a document with %s', (_, broken) => {
    const doc = { ...activityToDoc(activity), created_at: stamp(7), ...broken }

    expect(activityFromDoc('activity-1', doc, NOW)).toBeNull()
  })
})

describe('logs', () => {
  const log = makeLog({
    id: 'log-1',
    createdAt: 9,
    source: 'timer',
    partId: 'part-1',
    value: 12,
    effortMinutes: 12,
  })

  it('survives a round trip', () => {
    const doc = { ...logToDoc(log), created_at: stamp(9) }

    expect(logFromDoc('log-1', doc, NOW)).toEqual(log)
  })

  it.each([
    ['a day that is not a calendar date', { day: '12.10.2026' }],
    ['an unknown source', { source: 'import' }],
    ['a value that is not a number', { value: '12' }],
    ['a missing part id', { part_id: undefined }],
  ])('drops a document with %s', (_, broken) => {
    const doc = { ...logToDoc(log), created_at: stamp(9), ...broken }

    expect(logFromDoc('log-1', doc, NOW)).toBeNull()
  })
})

describe('goals', () => {
  const money = makeGoal({
    id: 'goal-1',
    createdAt: 11,
    skillId: 'skill-1',
    monthlyPlan: 5000,
    deadline: '2027-06-01',
  })
  const checklist = makeGoal({
    id: 'goal-2',
    createdAt: 12,
    kind: 'steps',
    target: 0,
    currency: '',
    steps: [
      { id: 'a', name: 'Register', done: true },
      { id: 'b', name: 'Exam', done: false },
    ],
  })
  const count = makeGoal({
    id: 'goal-3',
    createdAt: 13,
    kind: 'count',
    target: 3600,
    currency: '',
    activityIds: ['activity-1', 'activity-2'],
  })

  it.each([
    ['a money goal', money],
    ['a checklist', checklist],
    ['a count goal', count],
  ])('%s survives a round trip', (_, goal) => {
    const doc = { ...goalToDoc(goal), created_at: stamp(goal.createdAt) }

    expect(goalFromDoc(goal.id, doc, NOW)).toEqual(goal)
  })

  it('stores snake_case fields and nothing else; the writer adds created_at', () => {
    expect(Object.keys(goalToDoc(money)).sort()).toEqual([
      'activity_ids',
      'archived',
      'currency',
      'deadline',
      'kind',
      'monthly_plan',
      'name',
      'owner_uid',
      'skill_id',
      'start_day',
      'steps',
      'target',
    ])
  })

  it.each([
    ['an unknown kind', { kind: 'wish' }],
    ['an unknown currency', { currency: 'BTC' }],
    ['a deadline that is not a calendar date', { deadline: 'June' }],
    ['a start day that is not a calendar date', { start_day: '' }],
    ['activities that are not text', { activity_ids: [1, 2] }],
    ['a step without a done flag', { steps: [{ id: 'a', name: 'Step' }] }],
    ['a target that is not a number', { target: '60000' }],
  ])('drops a document with %s', (_, broken) => {
    const doc = { ...goalToDoc(money), created_at: stamp(11), ...broken }

    expect(goalFromDoc('goal-1', doc, NOW)).toBeNull()
  })
})

describe('goal entries', () => {
  const entry = makeEntry({ id: 'entry-1', createdAt: 15, amount: -2500.5 })

  it('survives a round trip', () => {
    const doc = { ...goalEntryToDoc(entry), created_at: stamp(15) }

    expect(goalEntryFromDoc('entry-1', doc, NOW)).toEqual(entry)
  })

  it.each([
    ['a zero amount', { amount: 0 }],
    ['an amount that is not a number', { amount: '100' }],
    ['a missing goal', { goal_id: undefined }],
    ['a day that is not a calendar date', { day: 'yesterday' }],
  ])('drops a document with %s', (_, broken) => {
    const doc = { ...goalEntryToDoc(entry), created_at: stamp(15), ...broken }

    expect(goalEntryFromDoc('entry-1', doc, NOW)).toBeNull()
  })
})
