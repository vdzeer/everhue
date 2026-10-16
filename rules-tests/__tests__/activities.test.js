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
  activityData,
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

const seedActivity = (id, ownerUid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(
      doc(context.firestore(), 'activities', id),
      activityData(ownerUid, overrides),
    ),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()

const createAsAlice = overrides =>
  setDoc(
    doc(asAlice(), 'activities', 'new-activity'),
    activityData(ALICE, overrides),
  )

const part = (index, overrides = {}) => ({
  id: `p${index}`,
  name: 'Part',
  target: 1,
  ...overrides,
})

/** Eight parts, the most an activity holds, with `overrides` on the last. */
const eightParts = (overrides = {}) =>
  Array.from({ length: 8 }, (_, index) =>
    index === 7 ? part(index, overrides) : part(index),
  )

describe('activities: reads', () => {
  it('lets the owner read and list their own', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'activities', 'alice-activity')))
    await assertSucceeds(
      getDocs(
        query(
          collection(asAlice(), 'activities'),
          where('owner_uid', '==', ALICE),
        ),
      ),
    )
  })

  it('refuses another user and an unscoped list', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertFails(getDoc(doc(asBob(), 'activities', 'alice-activity')))
    await assertFails(getDocs(collection(asAlice(), 'activities')))
  })
})

describe('activities: create', () => {
  it.each([
    ['a daily timed activity with parts', {}],
    [
      'eight parts with the longest id and name',
      {
        parts: Array.from({ length: 8 }, (_, index) => ({
          id: `${index}`.padEnd(40, 'x'),
          name: 'n'.repeat(40),
          target: 100000,
        })),
      },
    ],
    [
      'a schedule of every weekday',
      { schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5, 6, 7] } },
    ],
    [
      'a weekday schedule',
      { schedule: { type: 'weekdays', days: [1, 3, 5] }, parts: [] },
    ],
    ['a weekly schedule', { schedule: { type: 'weekly', times: 3 } }],
    [
      'a counted activity',
      { kind: 'count', target: 20, unit: 'pages', minutes_per_unit: 1.5 },
    ],
    ['a yes-or-no activity', { kind: 'check', target: 1, effort_minutes: 5 }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(overrides))
  })

  it('refuses a document owned by someone else', async () => {
    await assertFails(
      setDoc(doc(asAlice(), 'activities', 'new-activity'), activityData(BOB)),
    )
  })

  it.each([
    ['an unknown field', { xp_bonus: 2 }],
    ['an unknown kind', { kind: 'vibes' }],
    ['a zero target', { target: 0 }],
    ['a target that is not a number', { target: '10' }],
    ['a unit over 16 characters', { unit: 'x'.repeat(17) }],
    ['a zero minutes_per_unit', { minutes_per_unit: 0 }],
    ['negative effort minutes', { effort_minutes: -1 }],
    [
      'more than 8 parts',
      {
        parts: Array.from({ length: 9 }, (_, index) => ({
          id: `p${index}`,
          name: 'Part',
          target: 1,
        })),
      },
    ],
    ['an unknown schedule type', { schedule: { type: 'monthly' } }],
    ['a weekday schedule without days', { schedule: { type: 'weekdays' } }],
    [
      'a weekday schedule with no days chosen',
      { schedule: { type: 'weekdays', days: [] } },
    ],
    ['a weekly schedule of 0 times', { schedule: { type: 'weekly', times: 0 } }],
    ['a weekly schedule of 8 times', { schedule: { type: 'weekly', times: 8 } }],
    [
      'an unknown key inside the schedule',
      { schedule: { type: 'daily', note: 'hi' } },
    ],
    ['an empty name', { name: '' }],
    ['a created_at that is not a timestamp', { created_at: 'today' }],
    ['a created_at in the past', { created_at: CREATED_AT }],
    ['a created_at in the future', { created_at: inAnHour() }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(overrides))
  })

  // Each case breaks the eighth part only, so it also proves that the rules
  // reach the last index and not just the first.
  it.each([
    [
      'a part that is not a map',
      { parts: [...eightParts().slice(0, 7), 'Anki'] },
    ],
    ['a part with an unknown key', { parts: eightParts({ note: 'x' }) }],
    [
      'a part without a target',
      { parts: [...eightParts().slice(0, 7), { id: 'p7', name: 'Part' }] },
    ],
    ['a part with an empty id', { parts: eightParts({ id: '' }) }],
    [
      'a part id over 40 characters',
      { parts: eightParts({ id: 'x'.repeat(41) }) },
    ],
    ['a part with an empty name', { parts: eightParts({ name: '' }) }],
    [
      'a part name over 40 characters',
      { parts: eightParts({ name: 'x'.repeat(41) }) },
    ],
    [
      'a part name of 100 KB',
      { parts: eightParts({ name: 'x'.repeat(100 * 1024) }) },
    ],
    ['a part target of zero', { parts: eightParts({ target: 0 }) }],
    [
      'a part target that is not a number',
      { parts: eightParts({ target: '5' }) },
    ],
    ['a part target over 100000', { parts: eightParts({ target: 100001 }) }],
    [
      'a first part name of 100 KB',
      {
        parts: [
          part(0, { name: 'x'.repeat(100 * 1024) }),
          ...eightParts().slice(1),
        ],
      },
    ],
    ['a part name that is a number', { parts: eightParts({ name: 7 }) }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(overrides))
  })

  it.each([
    ['a weekday of 0', [1, 0]],
    ['a weekday of 8', [1, 8]],
    ['a weekday that is text', [1, '3']],
    ['a weekday of 100 KB', [1, 'x'.repeat(100 * 1024)]],
    ['a weekday that is a map', [1, { day: 3 }]],
  ])('refuses %s', async (_label, days) => {
    await assertFails(createAsAlice({ schedule: { type: 'weekdays', days } }))
  })
})

describe('activities: update and delete', () => {
  it('lets the owner change the target and archive', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'activities', 'alice-activity'), {
        target: 15,
        archived: true,
      }),
    )
  })

  it('lets the owner rewrite it whole, keeping the stored created_at', async () => {
    await seedActivity('alice-activity', ALICE, { created_at: CREATED_AT })

    await assertSucceeds(
      setDoc(
        doc(asAlice(), 'activities', 'alice-activity'),
        activityData(ALICE, {
          parts: eightParts(),
          schedule: { type: 'weekdays', days: [1, 3] },
          created_at: CREATED_AT,
        }),
      ),
    )
  })

  it.each([
    ['an earlier time', new Date('2020-01-01T00:00:00Z')],
    ['the server clock', serverTimestamp()],
  ])('refuses moving created_at to %s', async (_label, createdAt) => {
    await seedActivity('alice-activity', ALICE, { created_at: CREATED_AT })

    await assertFails(
      updateDoc(doc(asAlice(), 'activities', 'alice-activity'), {
        created_at: createdAt,
      }),
    )
  })

  it('refuses an update that adds an oversized part', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'activities', 'alice-activity'), {
        parts: eightParts({ name: 'x'.repeat(100 * 1024) }),
      }),
    )
  })

  it('refuses an update that breaks the shape', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'activities', 'alice-activity'), {
        kind: 'vibes',
      }),
    )
  })

  it('refuses moving it to another owner', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'activities', 'alice-activity'), {
        owner_uid: BOB,
      }),
    )
  })

  it('refuses another user updating or deleting it', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'activities', 'alice-activity'), { target: 1 }),
    )
    await assertFails(deleteDoc(doc(asBob(), 'activities', 'alice-activity')))
  })

  it('lets the owner delete', async () => {
    await seedActivity('alice-activity', ALICE)

    await assertSucceeds(
      deleteDoc(doc(asAlice(), 'activities', 'alice-activity')),
    )
  })
})
