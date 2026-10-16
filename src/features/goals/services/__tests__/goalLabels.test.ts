import { goalProgress, type GoalSources } from '~/core'
import {
  makeActivity,
  makeEntry,
  makeGoal,
  makeLog,
  makeSkill,
} from '~/core/__tests__/fixtures'
import type { Translate } from '~/services/i18n'
import { LOCALES } from '~/services/i18n/locales'

import {
  goalAmount,
  goalDeadlineLabel,
  goalProgressLabel,
  goalRealm,
  goalWarning,
  type GoalContext,
} from '../goalLabels'

/** The English file with `{{placeholders}}` filled in, without i18next. */
const t: Translate = (key, values = {}) =>
  Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, String(value)),
    LOCALES.en.strings[key] as string,
  )

const TODAY = '2026-10-12'
const NOTHING: GoalSources = { logs: [], entries: [], xpBySkill: {} }

const finance = makeSkill({ id: 'finance', realm: 'bay' })
const languages = makeSkill({ id: 'languages', realm: 'harbor' })
const english = makeActivity({
  id: 'english',
  kind: 'time',
  skillId: 'languages',
})
const reading = makeActivity({ id: 'reading', kind: 'count', unit: 'pages' })
const bedtime = makeActivity({ id: 'bedtime', kind: 'check' })

const context: GoalContext = {
  activities: [english, reading, bedtime],
  skills: [finance, languages],
  locale: 'en',
  t,
}

/** Intl separates with no-break spaces; tests compare plain ones. */
const plain = (text: string) => text.replace(/[  ]/g, ' ')

describe('goalAmount', () => {
  it('writes money in the goal currency', () => {
    const goal = makeGoal({ currency: 'USD' })

    expect(plain(goalAmount(goal, 1500, context))).toBe('$1,500')
    expect(plain(goalAmount(goal, 99.5, context))).toBe('$99.50')
  })

  it('writes time for a goal over timed activities', () => {
    const goal = makeGoal({
      kind: 'count',
      activityIds: ['english'],
      currency: '',
    })

    expect(goalAmount(goal, 6000, context)).toBe('100 h')
    expect(goalAmount(goal, 95, context)).toBe('1 h 35 min')
  })

  it('writes the unit for a goal over counted activities', () => {
    const goal = makeGoal({
      kind: 'count',
      activityIds: ['reading'],
      currency: '',
    })

    expect(goalAmount(goal, 320, context)).toBe('320 pages')
  })

  it('counts times for a goal over yes-or-no activities', () => {
    const goal = makeGoal({
      kind: 'count',
      activityIds: ['bedtime'],
      currency: '',
    })

    expect(goalAmount(goal, 12, context)).toBe('12 times')
  })
})

describe('goalProgressLabel', () => {
  it('reads "done of target" in the goal measure', () => {
    const goal = makeGoal({
      id: 'books',
      kind: 'count',
      target: 3600,
      activityIds: ['reading'],
      currency: '',
    })
    const logs = [makeLog({ activityId: 'reading', value: 320 })]
    const progress = goalProgress(goal, { ...NOTHING, logs }, TODAY)

    expect(goalProgressLabel(progress, context)).toBe('320 pages of 3600 pages')
  })

  it('names the level for a skill goal and the steps for a checklist', () => {
    const level = makeGoal({ kind: 'skill', target: 25, skillId: 'languages' })
    const list = makeGoal({
      kind: 'steps',
      steps: [
        { id: 'a', name: 'Register', done: true },
        { id: 'b', name: 'Exam', done: false },
      ],
    })

    expect(
      goalProgressLabel(goalProgress(level, NOTHING, TODAY), context),
    ).toBe('Level 0 of 25')
    expect(goalProgressLabel(goalProgress(list, NOTHING, TODAY), context)).toBe(
      'Steps: 1 of 2',
    )
  })
})

describe('goalDeadlineLabel', () => {
  const label = (deadline: string, entries = NOTHING.entries) =>
    goalDeadlineLabel(
      goalProgress(
        makeGoal({ id: 'laptop', target: 100, deadline }),
        { ...NOTHING, entries },
        TODAY,
      ),
      context,
    )

  it('is absent for a goal with no deadline', () => {
    expect(label('')).toBeNull()
  })

  it('counts the days left', () => {
    expect(label('2026-10-22')).toBe('By October 22, 2026 · days left: 10')
  })

  it('says so on the last day', () => {
    expect(label(TODAY)).toBe('By October 12, 2026 · the deadline is today')
  })

  it('counts the days past a missed deadline', () => {
    expect(label('2026-10-09')).toBe(
      'By October 9, 2026 · days past the deadline: 3',
    )
  })

  it('stops counting once the goal is reached', () => {
    const entries = [makeEntry({ goalId: 'laptop', amount: 100 })]

    expect(label('2026-10-09', entries)).toBe('By October 9, 2026')
  })
})

describe('goalRealm', () => {
  it('borrows the colour of the linked skill', () => {
    expect(goalRealm(makeGoal({ skillId: 'finance' }), context)).toBe('bay')
  })

  it('borrows the colour of its first activity for a count goal', () => {
    const goal = makeGoal({ kind: 'count', activityIds: ['english'] })

    expect(goalRealm(goal, context)).toBe('harbor')
  })

  it('has no colour of its own otherwise', () => {
    expect(goalRealm(makeGoal({ kind: 'steps' }), context)).toBeUndefined()
  })
})

describe('goalWarning', () => {
  it('says when the activities of a count goal are gone', () => {
    const goal = makeGoal({ kind: 'count', activityIds: ['deleted'] })

    expect(goalWarning(goal, context)).toBe('goal_no_activities')
  })

  it('says when the skill of a level goal is gone', () => {
    const goal = makeGoal({ kind: 'skill', skillId: 'deleted' })

    expect(goalWarning(goal, context)).toBe('goal_skill_missing')
  })

  it('is silent for a goal that has what it needs', () => {
    expect(goalWarning(makeGoal(), context)).toBeNull()
    expect(
      goalWarning(
        makeGoal({ kind: 'count', activityIds: ['english'] }),
        context,
      ),
    ).toBeNull()
  })
})
