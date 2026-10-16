const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore')

const {
  ALICE,
  BOB,
  CREATED_AT,
  inAnHour,
  logData,
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

const seedLog = (id, ownerUid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(doc(context.firestore(), 'logs', id), logData(ownerUid, overrides)),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

const createAsAlice = overrides =>
  setDoc(doc(asAlice(), 'logs', 'new-log'), logData(ALICE, overrides))

describe('logs: reads', () => {
  it('lets the owner read and list their own', async () => {
    await seedLog('alice-log', ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'logs', 'alice-log')))
    await assertSucceeds(
      getDocs(
        query(collection(asAlice(), 'logs'), where('owner_uid', '==', ALICE)),
      ),
    )
  })

  it('refuses another user, a guest and an unscoped list', async () => {
    await seedLog('alice-log', ALICE)

    await assertFails(getDoc(doc(asBob(), 'logs', 'alice-log')))
    await assertFails(getDoc(doc(asGuest(), 'logs', 'alice-log')))
    await assertFails(getDocs(collection(asAlice(), 'logs')))
  })
})

describe('logs: create', () => {
  it.each([
    ['a timer log for a part', {}],
    ['a manual log without a part', { source: 'manual', part_id: '' }],
    [
      'a counted log',
      { kind: 'count', value: 12, effort_minutes: 18, source: 'manual' },
    ],
    ['a yes-or-no log', { kind: 'check', value: 1, source: 'manual' }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(overrides))
  })

  it('refuses a log owned by someone else', async () => {
    await assertFails(setDoc(doc(asAlice(), 'logs', 'new-log'), logData(BOB)))
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(setDoc(doc(asGuest(), 'logs', 'new-log'), logData(ALICE)))
  })

  it.each([
    ['an unknown field', { xp: 500 }],
    ['a day that is not YYYY-MM-DD', { day: '12.10.2026' }],
    ['a day with a time attached', { day: '2026-10-12T10:00' }],
    ['a zero value', { value: 0 }],
    ['a negative value', { value: -5 }],
    ['more effort than a day holds', { effort_minutes: 1441 }],
    ['an unknown source', { source: 'trust-me' }],
    ['an unknown kind', { kind: 'vibes' }],
    ['a part id over 40 characters', { part_id: 'x'.repeat(41) }],
    ['a created_at that is not a timestamp', { created_at: 1760000000 }],
    ['a created_at in the past', { created_at: CREATED_AT }],
    ['a created_at in the future', { created_at: inAnHour() }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(overrides))
  })
})

describe('logs: no edits, delete is the undo', () => {
  it('refuses the owner editing a log in place', async () => {
    await seedLog('alice-log', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'logs', 'alice-log'), { value: 500 }),
    )
  })

  it('lets the owner delete', async () => {
    await seedLog('alice-log', ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'logs', 'alice-log')))
  })

  it('refuses another user deleting it', async () => {
    await seedLog('alice-log', ALICE)

    await assertFails(deleteDoc(doc(asBob(), 'logs', 'alice-log')))
  })
})
