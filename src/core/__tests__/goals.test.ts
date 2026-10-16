import {
  CONTRIBUTION_EFFORT_MINUTES,
  buildGoals,
  contributionLogs,
  goalLogId,
  goalProgress,
  type GoalSources,
} from '../goals'
import { SKILL_LEVEL_COEFF, xpForLevel } from '../levels'
import { computeXp } from '../xp'

import { makeEntry, makeGoal, makeLog } from './fixtures'

const TODAY = '2026-10-12'
const NOTHING: GoalSources = { logs: [], entries: [], xpBySkill: {} }

describe('a count goal', () => {
  const goal = makeGoal({
    kind: 'count',
    target: 300,
    activityIds: ['reading', 'audiobooks'],
    startDay: '2026-10-01',
    currency: '',
  })

  it('adds up the logs of its activities from the start day on', () => {
    const logs = [
      makeLog({ activityId: 'reading', day: '2026-10-01', value: 20 }),
      makeLog({ activityId: 'audiobooks', day: '2026-10-05', value: 30 }),
      makeLog({ activityId: 'reading', day: '2026-09-30', value: 500 }),
      makeLog({ activityId: 'running', day: '2026-10-05', value: 500 }),
    ]

    expect(goalProgress(goal, { ...NOTHING, logs }, TODAY)).toMatchObject({
      done: 50,
      target: 300,
      ratio: 50 / 300,
      complete: false,
    })
  })

  it('is reached at the target and the bar stops at full', () => {
    const logs = [makeLog({ activityId: 'reading', value: 450 })]

    expect(goalProgress(goal, { ...NOTHING, logs }, TODAY)).toMatchObject({
      done: 450,
      ratio: 1,
      complete: true,
    })
  })
})

describe('a skill goal', () => {
  const goal = makeGoal({
    kind: 'skill',
    target: 10,
    skillId: 'english',
    currency: '',
  })

  it('reports the level and moves by XP between levels', () => {
    const xp = xpForLevel(5, SKILL_LEVEL_COEFF)
    const progress = goalProgress(
      goal,
      { ...NOTHING, xpBySkill: { english: xp } },
      TODAY,
    )

    expect(progress.done).toBe(5)
    expect(progress.ratio).toBeCloseTo(0.25)
    expect(progress.complete).toBe(false)
  })

  it('is reached at the level', () => {
    const xp = xpForLevel(10, SKILL_LEVEL_COEFF)

    expect(
      goalProgress(goal, { ...NOTHING, xpBySkill: { english: xp } }, TODAY)
        .complete,
    ).toBe(true)
  })

  it('is at zero for a skill with no XP', () => {
    expect(goalProgress(goal, NOTHING, TODAY)).toMatchObject({
      done: 0,
      ratio: 0,
    })
  })
})

describe('a steps goal', () => {
  const steps = [
    { id: 'a', name: 'Register', done: true },
    { id: 'b', name: 'Mock test', done: false },
    { id: 'c', name: 'Exam', done: false },
  ]

  it('counts the steps that are done', () => {
    const goal = makeGoal({ kind: 'steps', target: 0, steps, currency: '' })

    expect(goalProgress(goal, NOTHING, TODAY)).toMatchObject({
      done: 1,
      target: 3,
      complete: false,
    })
  })

  it('is reached when every step is done, never while it has none', () => {
    const all = steps.map(step => ({ ...step, done: true }))

    expect(
      goalProgress(makeGoal({ kind: 'steps', steps: all }), NOTHING, TODAY)
        .complete,
    ).toBe(true)
    expect(
      goalProgress(makeGoal({ kind: 'steps', steps: [] }), NOTHING, TODAY),
    ).toMatchObject({ ratio: 0, complete: false })
  })
})

describe('a money goal', () => {
  const goal = makeGoal({ id: 'laptop', target: 60000, deadline: '2027-06-01' })
  const entries = [
    makeEntry({ goalId: 'laptop', amount: 20000, day: '2026-09-10' }),
    makeEntry({ goalId: 'laptop', amount: 6000, day: '2026-10-03' }),
    makeEntry({ goalId: 'laptop', amount: -2000, day: '2026-10-08' }),
    makeEntry({ goalId: 'other', amount: 99999, day: '2026-10-08' }),
  ]

  it('adds what was put in and subtracts what was taken out', () => {
    expect(goalProgress(goal, { ...NOTHING, entries }, TODAY)).toMatchObject({
      done: 24000,
      target: 60000,
      ratio: 0.4,
      complete: false,
    })
  })

  it('reports the current month on its own', () => {
    expect(
      goalProgress(goal, { ...NOTHING, entries }, TODAY).money?.monthIn,
    ).toBe(4000)
  })

  it('spreads what is left over the months to the deadline', () => {
    // October to June, both counted, is 9 months; 36 000 are left.
    expect(
      goalProgress(goal, { ...NOTHING, entries }, TODAY).money?.monthlyNeeded,
    ).toBe(4000)
  })

  it('asks for all of it in a deadline month', () => {
    const soon = { ...goal, deadline: '2026-10-31' }

    expect(
      goalProgress(soon, { ...NOTHING, entries }, TODAY).money?.monthlyNeeded,
    ).toBe(36000)
  })

  it('has no monthly figure without a deadline, after it, or when reached', () => {
    const open = { ...goal, deadline: '' as const }
    const late = { ...goal, deadline: '2026-10-01' }
    const full = [makeEntry({ goalId: 'laptop', amount: 60000 })]

    expect(
      goalProgress(open, { ...NOTHING, entries }, TODAY).money?.monthlyNeeded,
    ).toBeNull()
    expect(
      goalProgress(late, { ...NOTHING, entries }, TODAY).money?.monthlyNeeded,
    ).toBeNull()
    expect(
      goalProgress(goal, { ...NOTHING, entries: full }, TODAY).money
        ?.monthlyNeeded,
    ).toBeNull()
  })

  it('never shows less than an empty bar when more was taken out than put in', () => {
    const drained = [makeEntry({ goalId: 'laptop', amount: -500 })]

    expect(
      goalProgress(goal, { ...NOTHING, entries: drained }, TODAY),
    ).toMatchObject({ done: -500, ratio: 0 })
  })
})

describe('deadlines', () => {
  it('counts the days left, and marks a missed goal overdue', () => {
    const ahead = makeGoal({ deadline: '2026-10-22' })
    const missed = makeGoal({ deadline: '2026-10-09' })

    expect(goalProgress(ahead, NOTHING, TODAY)).toMatchObject({
      daysLeft: 10,
      overdue: false,
    })
    expect(goalProgress(missed, NOTHING, TODAY)).toMatchObject({
      daysLeft: -3,
      overdue: true,
    })
  })

  it('is not overdue on the deadline day itself, nor once reached', () => {
    const lastDay = makeGoal({ deadline: TODAY })
    const reached = makeGoal({ id: 'done', target: 10, deadline: '2026-10-01' })
    const entries = [makeEntry({ goalId: 'done', amount: 10 })]

    expect(goalProgress(lastDay, NOTHING, TODAY).overdue).toBe(false)
    expect(goalProgress(reached, { ...NOTHING, entries }, TODAY).overdue).toBe(
      false,
    )
  })

  it('has no days left without a deadline', () => {
    expect(goalProgress(makeGoal(), NOTHING, TODAY).daysLeft).toBeNull()
  })
})

describe('buildGoals', () => {
  it('splits goals into active, reached and archived', () => {
    const goals = [
      makeGoal({ id: 'open' }),
      makeGoal({ id: 'full', target: 100 }),
      makeGoal({ id: 'old', archived: true }),
    ]
    const entries = [makeEntry({ goalId: 'full', amount: 100 })]
    const view = buildGoals(goals, { ...NOTHING, entries }, TODAY)

    expect(view.active.map(item => item.goal.id)).toEqual(['open'])
    expect(view.reached.map(item => item.goal.id)).toEqual(['full'])
    expect(view.archived.map(item => item.goal.id)).toEqual(['old'])
  })

  it('lists the nearest deadline first and goals without one last', () => {
    const goals = [
      makeGoal({ id: 'someday', createdAt: 1 }),
      makeGoal({ id: 'june', deadline: '2027-06-01', createdAt: 2 }),
      makeGoal({ id: 'december', deadline: '2026-12-31', createdAt: 3 }),
    ]

    expect(
      buildGoals(goals, NOTHING, TODAY).active.map(item => item.goal.id),
    ).toEqual(['december', 'june', 'someday'])
  })
})

describe('contributionLogs', () => {
  const goal = makeGoal({ id: 'laptop', skillId: 'finance' })

  it('turns a day with money put in into one log for the linked skill', () => {
    const entries = [
      makeEntry({ goalId: 'laptop', amount: 5000, day: '2026-10-03' }),
    ]

    expect(contributionLogs([goal], entries)).toEqual([
      expect.objectContaining({
        id: goalLogId('laptop', '2026-10-03'),
        skillId: 'finance',
        day: '2026-10-03',
        effortMinutes: CONTRIBUTION_EFFORT_MINUTES,
        source: 'manual',
      }),
    ])
  })

  it('pays the same for one payment as for the same sum split into ten', () => {
    const once = [makeEntry({ goalId: 'laptop', amount: 5000 })]
    const split = Array.from({ length: 10 }, () =>
      makeEntry({ goalId: 'laptop', amount: 500 }),
    )

    expect(computeXp(contributionLogs([goal], split)).total).toBe(
      computeXp(contributionLogs([goal], once)).total,
    )
  })

  it('pays the same for a small sum as for a large one', () => {
    const small = [makeEntry({ goalId: 'laptop', amount: 1 })]
    const large = [makeEntry({ goalId: 'laptop', amount: 1_000_000 })]

    expect(computeXp(contributionLogs([goal], small)).total).toBe(
      computeXp(contributionLogs([goal], large)).total,
    )
  })

  it('earns nothing for taking money out', () => {
    const entries = [makeEntry({ goalId: 'laptop', amount: -5000 })]

    expect(contributionLogs([goal], entries)).toEqual([])
  })

  it('earns nothing for a goal that is not linked to a skill', () => {
    const unlinked = makeGoal({ id: 'laptop', skillId: '' })

    expect(
      contributionLogs([unlinked], [makeEntry({ goalId: 'laptop' })]),
    ).toEqual([])
  })

  it('keeps separate goals and separate days apart', () => {
    const trip = makeGoal({ id: 'trip', skillId: 'finance' })
    const entries = [
      makeEntry({ goalId: 'laptop', day: '2026-10-03' }),
      makeEntry({ goalId: 'laptop', day: '2026-10-04' }),
      makeEntry({ goalId: 'trip', day: '2026-10-04' }),
    ]

    expect(contributionLogs([goal, trip], entries)).toHaveLength(3)
  })
})
