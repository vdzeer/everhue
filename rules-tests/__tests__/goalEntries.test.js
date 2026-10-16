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
  goalEntryData,
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

const seedEntry = (id, ownerUid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(
      doc(context.firestore(), 'goal_entries', id),
      goalEntryData(ownerUid, overrides),
    ),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

const createAsAlice = overrides =>
  setDoc(
    doc(asAlice(), 'goal_entries', 'new-entry'),
    goalEntryData(ALICE, overrides),
  )

describe('goal entries: reads', () => {
  it('lets the owner read and list their own', async () => {
    await seedEntry('alice-entry', ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'goal_entries', 'alice-entry')))
    await assertSucceeds(
      getDocs(
        query(
          collection(asAlice(), 'goal_entries'),
          where('owner_uid', '==', ALICE),
        ),
      ),
    )
  })

  it('refuses another user, a guest and an unscoped list', async () => {
    await seedEntry('alice-entry', ALICE)

    await assertFails(getDoc(doc(asBob(), 'goal_entries', 'alice-entry')))
    await assertFails(getDoc(doc(asGuest(), 'goal_entries', 'alice-entry')))
    await assertFails(getDocs(collection(asAlice(), 'goal_entries')))
  })
})

describe('goal entries: create', () => {
  it.each([
    ['money put in', {}],
    ['money taken out', { amount: -1500 }],
    ['an amount with cents', { amount: 99.5 }],
    ['an entry for a past day', { day: '2026-09-01' }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(overrides))
  })

  it('refuses an entry owned by someone else', async () => {
    await assertFails(
      setDoc(doc(asAlice(), 'goal_entries', 'new-entry'), goalEntryData(BOB)),
    )
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(
      setDoc(doc(asGuest(), 'goal_entries', 'new-entry'), goalEntryData(ALICE)),
    )
  })

  it.each([
    ['an unknown field', { xp: 500 }],
    ['a zero amount', { amount: 0 }],
    ['an amount that is not a number', { amount: '5000' }],
    ['an amount beyond the limit', { amount: 1000000001 }],
    ['a missing goal', { goal_id: '' }],
    ['a day that is not YYYY-MM-DD', { day: '12.10.2026' }],
    ['a created_at that is not a timestamp', { created_at: 1760000000 }],
    ['a created_at in the past', { created_at: CREATED_AT }],
    ['a created_at in the future', { created_at: inAnHour() }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(overrides))
  })
})

describe('goal entries: no edits, delete is the undo', () => {
  it('refuses the owner editing an entry in place', async () => {
    await seedEntry('alice-entry', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'goal_entries', 'alice-entry'), {
        amount: 500000,
      }),
    )
  })

  it('lets the owner delete', async () => {
    await seedEntry('alice-entry', ALICE)

    await assertSucceeds(
      deleteDoc(doc(asAlice(), 'goal_entries', 'alice-entry')),
    )
  })

  it('refuses another user deleting it', async () => {
    await seedEntry('alice-entry', ALICE)

    await assertFails(deleteDoc(doc(asBob(), 'goal_entries', 'alice-entry')))
  })
})
