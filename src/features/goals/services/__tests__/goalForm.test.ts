import { makeActivity, makeGoal } from '~/core/__tests__/fixtures'

import {
  countedAlike,
  goalFormSchema,
  goalFormValues,
  goalFromForm,
  isTimed,
  type GoalFormValues,
} from '../goalForm'

const TODAY = '2026-10-12'

const english = makeActivity({ id: 'english', kind: 'time' })
const podcast = makeActivity({ id: 'podcast', kind: 'time' })
const reading = makeActivity({ id: 'reading', kind: 'count', unit: 'pages' })
const comics = makeActivity({ id: 'comics', kind: 'count', unit: 'pages' })
const running = makeActivity({ id: 'running', kind: 'count', unit: 'km' })
const ACTIVITIES = [english, podcast, reading, comics, running]

const DEFAULTS = {
  today: TODAY,
  defaultSkillId: 'skill-1',
  activities: ACTIVITIES,
}

const values = (overrides: Partial<GoalFormValues> = {}): GoalFormValues => ({
  ...goalFormValues(undefined, DEFAULTS),
  name: 'Laptop',
  target: '60000',
  ...overrides,
})

const errorsOf = (form: GoalFormValues) => {
  try {
    goalFormSchema.validateSync(form, { abortEarly: false })
    return []
  } catch (error) {
    return (error as { inner: { path: string; message: string }[] }).inner.map(
      item => `${item.path}: ${item.message}`,
    )
  }
}

describe('a new goal', () => {
  it('starts as a savings goal counted from today with no deadline', () => {
    expect(goalFormValues(undefined, DEFAULTS)).toMatchObject({
      kind: 'money',
      currency: 'UAH',
      startDay: TODAY,
      deadline: '',
      skillId: '',
    })
  })
})

describe('validation', () => {
  it('accepts a savings goal with a name and an amount', () => {
    expect(errorsOf(values())).toEqual([])
  })

  it.each([
    ['no name', { name: '  ' }, 'name: error_required'],
    ['a zero amount', { target: '0' }, 'target: error_positive'],
    [
      'an amount that is not a number',
      { target: 'a lot' },
      'target: error_positive',
    ],
    [
      'a negative monthly plan',
      { monthlyPlan: '-5' },
      'monthlyPlan: error_not_negative',
    ],
    [
      'a deadline that is not a date',
      { deadline: 'June' },
      'deadline: error_date',
    ],
  ])('refuses a savings goal with %s', (_, overrides, error) => {
    expect(errorsOf(values(overrides))).toEqual([error])
  })

  it('accepts a comma as the decimal mark', () => {
    expect(errorsOf(values({ target: '1500,50' }))).toEqual([])
  })

  it('asks a count goal for an activity, a total and a start day', () => {
    expect(
      errorsOf(
        values({ kind: 'count', activityIds: [], target: '', startDay: '' }),
      ).sort(),
    ).toEqual([
      'activityIds: error_pick_activity',
      'startDay: error_date',
      'target: error_positive',
    ])
  })

  it.each([['0'], ['2.5'], ['']])(
    'refuses %j as the level of a skill goal',
    level => {
      expect(
        errorsOf(
          values({ kind: 'skill', skillId: 'skill-1', level, target: '' }),
        ),
      ).toEqual(['level: error_level'])
    },
  )

  it('asks a skill goal for a skill', () => {
    expect(
      errorsOf(values({ kind: 'skill', skillId: '', level: '5', target: '' })),
    ).toEqual(['skillId: error_required'])
  })

  it('asks a checklist for at least one named step', () => {
    expect(errorsOf(values({ kind: 'steps', steps: [], target: '' }))).toEqual([
      'steps: error_steps',
    ])
    expect(
      errorsOf(
        values({
          kind: 'steps',
          target: '',
          steps: [{ id: 'a', name: ' ', done: false }],
        }),
      ),
    ).toEqual(['steps[0].name: error_required'])
  })

  it('does not ask a checklist for an amount', () => {
    expect(
      errorsOf(
        values({
          kind: 'steps',
          target: '',
          steps: [{ id: 'a', name: 'Register', done: false }],
        }),
      ),
    ).toEqual([])
  })
})

describe('countedAlike', () => {
  it('lets timed activities add up with each other', () => {
    expect(countedAlike(english, podcast)).toBe(true)
  })

  it('lets counted activities add up only in the same unit', () => {
    expect(countedAlike(reading, comics)).toBe(true)
    expect(countedAlike(reading, running)).toBe(false)
  })

  it('never mixes time with a count', () => {
    expect(countedAlike(english, reading)).toBe(false)
  })
})

describe('goalFromForm', () => {
  it('stores a goal over timed activities in minutes', () => {
    const form = values({
      kind: 'count',
      activityIds: ['english', 'podcast'],
      target: '100',
    })

    expect(isTimed(form.activityIds, ACTIVITIES)).toBe(true)
    expect(goalFromForm(form, ACTIVITIES, TODAY)).toMatchObject({
      kind: 'count',
      target: 6000,
      activityIds: ['english', 'podcast'],
      currency: '',
      monthlyPlan: 0,
    })
  })

  it('stores a goal over counted activities as typed', () => {
    const form = values({
      kind: 'count',
      activityIds: ['reading'],
      target: '3600',
    })

    expect(goalFromForm(form, ACTIVITIES, TODAY).target).toBe(3600)
  })

  it('keeps the plan, the currency and the skill of a savings goal', () => {
    const form = values({
      currency: 'EUR',
      monthlyPlan: '250',
      skillId: 'finance',
      deadline: '2027-06-01',
    })

    expect(goalFromForm(form, ACTIVITIES, TODAY)).toMatchObject({
      kind: 'money',
      target: 60000,
      currency: 'EUR',
      monthlyPlan: 250,
      skillId: 'finance',
      deadline: '2027-06-01',
      steps: [],
      activityIds: [],
    })
  })

  it('treats an empty plan as no plan', () => {
    expect(goalFromForm(values(), ACTIVITIES, TODAY).monthlyPlan).toBe(0)
  })

  it('drops what belongs to another kind', () => {
    const form = values({
      kind: 'steps',
      currency: 'USD',
      monthlyPlan: '100',
      skillId: 'finance',
      activityIds: ['english'],
      steps: [{ id: 'a', name: ' Register ', done: true }],
    })

    expect(goalFromForm(form, ACTIVITIES, TODAY)).toMatchObject({
      kind: 'steps',
      target: 0,
      currency: '',
      monthlyPlan: 0,
      skillId: '',
      activityIds: [],
      steps: [{ id: 'a', name: 'Register', done: true }],
    })
  })

  it('stores the level of a skill goal', () => {
    const form = values({
      kind: 'skill',
      skillId: 'english-skill',
      level: '25',
    })

    expect(goalFromForm(form, ACTIVITIES, TODAY)).toMatchObject({
      target: 25,
      skillId: 'english-skill',
    })
  })
})

describe('editing', () => {
  it('shows a timed goal in hours again', () => {
    const goal = makeGoal({
      kind: 'count',
      target: 6000,
      activityIds: ['english'],
      currency: '',
    })

    expect(goalFormValues(goal, DEFAULTS).target).toBe('100')
  })

  it('round-trips a savings goal', () => {
    const goal = makeGoal({
      target: 60000,
      monthlyPlan: 5000,
      skillId: 'finance',
      deadline: '2027-06-01',
    })
    const { name, kind, target, currency, monthlyPlan, skillId, deadline } =
      goalFromForm(goalFormValues(goal, DEFAULTS), ACTIVITIES, TODAY)

    expect({
      name,
      kind,
      target,
      currency,
      monthlyPlan,
      skillId,
      deadline,
    }).toEqual({
      name: goal.name,
      kind: goal.kind,
      target: goal.target,
      currency: goal.currency,
      monthlyPlan: goal.monthlyPlan,
      skillId: goal.skillId,
      deadline: goal.deadline,
    })
  })

  it('keeps which steps were already done', () => {
    const goal = makeGoal({
      kind: 'steps',
      target: 0,
      currency: '',
      steps: [
        { id: 'a', name: 'Register', done: true },
        { id: 'b', name: 'Exam', done: false },
      ],
    })

    expect(
      goalFromForm(goalFormValues(goal, DEFAULTS), ACTIVITIES, TODAY).steps,
    ).toEqual(goal.steps)
  })
})
