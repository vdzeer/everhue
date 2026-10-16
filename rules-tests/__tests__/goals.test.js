const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore')

const {
  ALICE,
  BOB,
  CREATED_AT,
  goalData,
  inAnHour,
  setupTestEnv,
} = require('../helpers')

let testEnv

beforeAll(async () => {
  testEnv = await setupTestEnv()
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

const seedGoal = (id, ownerUid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(doc(context.firestore(), 'goals', id), goalData(ownerUid, overrides)),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

const createAsAlice = overrides =>
  setDoc(doc(asAlice(), 'goals', 'new-goal'), goalData(ALICE, overrides))

const CHECKLIST = { kind: 'steps', target: 0, currency: '', monthly_plan: 0 }
const COUNT = { kind: 'count', target: 600, currency: '', monthly_plan: 0 }

const step = (index, overrides = {}) => ({
  id: `s${index}`,
  name: 'Step',
  done: false,
  ...overrides,
})

/** Twenty steps, the most a checklist holds, with `overrides` on the last. */
const twentySteps = (overrides = {}) =>
  Array.from({ length: 20 }, (_, index) =>
    index === 19 ? step(index, overrides) : step(index),
  )

/** Eight activity ids, the most a goal counts, with `last` as the eighth. */
const eightIds = last => [
  ...Array.from({ length: 7 }, (_, index) => `activity-${index}`),
  last,
]

/** The longest checklist the app can write: 20 steps, names of 80. */
const longestSteps = () =>
  Array.from({ length: 20 }, (_, index) => ({
    id: `${index}`.padEnd(40, 'x'),
    name: 'n'.repeat(80),
    done: index % 2 === 0,
  }))

describe('goals: reads', () => {
  it('lets the owner read and list their own', async () => {
    await seedGoal('alice-goal', ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'goals', 'alice-goal')))
    await assertSucceeds(
      getDocs(
        query(collection(asAlice(), 'goals'), where('owner_uid', '==', ALICE)),
      ),
    )
  })

  it('refuses another user, a guest and an unscoped list', async () => {
    await seedGoal('alice-goal', ALICE)

    await assertFails(getDoc(doc(asBob(), 'goals', 'alice-goal')))
    await assertFails(getDoc(doc(asGuest(), 'goals', 'alice-goal')))
    await assertFails(getDocs(collection(asAlice(), 'goals')))
  })
})

describe('goals: create', () => {
  it.each([
    ['a money goal with a plan', {}],
    ['the longest checklist', { ...CHECKLIST, steps: longestSteps() }],
    [
      'a count goal over eight activities with the longest ids',
      { ...COUNT, activity_ids: eightIds('a'.repeat(80)) },
    ],
    ['a money goal with no deadline and no plan', { deadline: '', monthly_plan: 0 }],
    ['a money goal that trains a skill', { skill_id: 'skill-1' }],
    [
      'a count goal over two activities',
      {
        kind: 'count',
        target: 3600,
        activity_ids: ['activity-1', 'activity-2'],
        currency: '',
        monthly_plan: 0,
      },
    ],
    [
      'a skill goal',
      { kind: 'skill', target: 25, skill_id: 'skill-1', currency: '', monthly_plan: 0 },
    ],
    [
      'a checklist',
      {
        kind: 'steps',
        target: 0,
        steps: [
          { id: 's1', name: 'Register', done: true },
          { id: 's2', name: 'Exam', done: false },
        ],
        currency: '',
        monthly_plan: 0,
      },
    ],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(overrides))
  })

  it('refuses a goal owned by someone else', async () => {
    await assertFails(setDoc(doc(asAlice(), 'goals', 'new-goal'), goalData(BOB)))
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(
      setDoc(doc(asGuest(), 'goals', 'new-goal'), goalData(ALICE)),
    )
  })

  it.each([
    ['an unknown field', { progress: 0.99 }],
    ['an empty name', { name: '' }],
    ['a name over 80 characters', { name: 'x'.repeat(81) }],
    ['an unknown kind', { kind: 'wish' }],
    ['a money goal with a zero target', { target: 0 }],
    ['a negative target', { target: -1 }],
    ['a target that is not a number', { target: '60000' }],
    ['a money goal without a currency', { currency: '' }],
    ['a currency the app does not know', { currency: 'BTC' }],
    ['a negative monthly plan', { monthly_plan: -1 }],
    [
      'more than 8 activities',
      { ...COUNT, activity_ids: Array(9).fill('activity') },
    ],
    [
      'activities that are not a list',
      { ...COUNT, activity_ids: 'activity-1' },
    ],
    [
      'more than 20 steps',
      {
        ...CHECKLIST,
        steps: Array(21).fill({ id: 's', name: 'Step', done: false }),
      },
    ],
    // A checklist holds steps and nothing else; no other kind holds steps.
    [
      'a checklist with a target',
      { ...CHECKLIST, steps: [step(0)], target: 5 },
    ],
    [
      'a checklist with a currency',
      { ...CHECKLIST, steps: [step(0)], currency: 'UAH' },
    ],
    [
      'a checklist with a monthly plan',
      { ...CHECKLIST, steps: [step(0)], monthly_plan: 100 },
    ],
    [
      'a checklist that counts activities',
      { ...CHECKLIST, steps: [step(0)], activity_ids: ['activity-1'] },
    ],
    [
      'a checklist that trains a skill',
      { ...CHECKLIST, steps: [step(0)], skill_id: 'skill-1' },
    ],
    ['a money goal with steps', { steps: [step(0)] }],
    ['a start day that is not YYYY-MM-DD', { start_day: '12.10.2026' }],
    ['a deadline that is not YYYY-MM-DD', { deadline: 'June' }],
    ['a deadline that is not text', { deadline: null }],
    ['an archived flag that is not a boolean', { archived: 'no' }],
    ['a created_at that is not a timestamp', { created_at: 1760000000 }],
    ['a created_at in the past', { created_at: CREATED_AT }],
    ['a created_at in the future', { created_at: inAnHour() }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(overrides))
  })

  // Each case breaks the last element only, so it also proves that the
  // rules reach the last index and not just the first.
  it.each([
    ['an activity id that is a number', eightIds(7)],
    ['an empty activity id', eightIds('')],
    ['an activity id over 80 characters', eightIds('a'.repeat(81))],
    ['an activity id of 100 KB', eightIds('a'.repeat(100 * 1024))],
    ['a first activity id of 100 KB', ['a'.repeat(100 * 1024), 'activity-1']],
  ])('refuses %s', async (_label, activityIds) => {
    await assertFails(createAsAlice({ ...COUNT, activity_ids: activityIds }))
  })

  it.each([
    ['a step that is not a map', [...twentySteps().slice(0, 19), 'Exam']],
    ['a step with an unknown key', twentySteps({ note: 'x' })],
    [
      'a step without done',
      [...twentySteps().slice(0, 19), { id: 's19', name: 'Step' }],
    ],
    ['a step whose done is not a boolean', twentySteps({ done: 'yes' })],
    ['a step with an empty id', twentySteps({ id: '' })],
    ['a step id that is a number', twentySteps({ id: 19 })],
    ['a step id over 40 characters', twentySteps({ id: 'x'.repeat(41) })],
    ['a step with an empty name', twentySteps({ name: '' })],
    ['a step name over 80 characters', twentySteps({ name: 'x'.repeat(81) })],
    ['a step name of 100 KB', twentySteps({ name: 'x'.repeat(100 * 1024) })],
    [
      'a first step name of 100 KB',
      [step(0, { name: 'x'.repeat(100 * 1024) }), ...twentySteps().slice(1)],
    ],
  ])('refuses %s', async (_label, steps) => {
    await assertFails(createAsAlice({ ...CHECKLIST, steps }))
  })
})

describe('goals: update and delete', () => {
  it('lets the owner tick a step and archive the goal', async () => {
    await seedGoal('alice-goal', ALICE, {
      kind: 'steps',
      target: 0,
      currency: '',
      monthly_plan: 0,
      steps: [{ id: 's1', name: 'Register', done: false }],
    })

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'goals', 'alice-goal'), {
        steps: [{ id: 's1', name: 'Register', done: true }],
        archived: true,
      }),
    )
  })

  it('lets the owner tick a step in the longest checklist', async () => {
    await seedGoal('alice-goal', ALICE, { ...CHECKLIST, steps: longestSteps() })

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'goals', 'alice-goal'), {
        steps: longestSteps().map(item => ({ ...item, done: true })),
      }),
    )
  })

  it('lets the owner rewrite it whole, keeping the stored created_at', async () => {
    await seedGoal('alice-goal', ALICE, { created_at: CREATED_AT })

    await assertSucceeds(
      setDoc(
        doc(asAlice(), 'goals', 'alice-goal'),
        goalData(ALICE, { name: 'New laptop', created_at: CREATED_AT }),
      ),
    )
  })

  it.each([
    ['an earlier time', new Date('2020-01-01T00:00:00Z')],
    ['the server clock', serverTimestamp()],
  ])('refuses moving created_at to %s', async (_label, createdAt) => {
    await seedGoal('alice-goal', ALICE, { created_at: CREATED_AT })

    await assertFails(
      updateDoc(doc(asAlice(), 'goals', 'alice-goal'), {
        created_at: createdAt,
      }),
    )
  })

  it('refuses an update that adds an oversized step', async () => {
    await seedGoal('alice-goal', ALICE, { ...CHECKLIST, steps: [step(0)] })

    await assertFails(
      updateDoc(doc(asAlice(), 'goals', 'alice-goal'), {
        steps: twentySteps({ name: 'x'.repeat(100 * 1024) }),
      }),
    )
  })

  it('refuses an update that breaks the shape', async () => {
    await seedGoal('alice-goal', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'goals', 'alice-goal'), { target: 0 }),
    )
    await assertFails(
      updateDoc(doc(asAlice(), 'goals', 'alice-goal'), { saved: 60000 }),
    )
  })

  it('refuses handing the goal to another owner', async () => {
    await seedGoal('alice-goal', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'goals', 'alice-goal'), { owner_uid: BOB }),
    )
  })

  it('refuses another user editing or deleting it', async () => {
    await seedGoal('alice-goal', ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'goals', 'alice-goal'), { name: 'Mine now' }),
    )
    await assertFails(deleteDoc(doc(asBob(), 'goals', 'alice-goal')))
  })

  it('lets the owner delete', async () => {
    await seedGoal('alice-goal', ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'goals', 'alice-goal')))
  })
})
