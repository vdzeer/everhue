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
  inAnHour,
  setupTestEnv,
  skillData,
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

const seedSkill = (id, ownerUid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(
      doc(context.firestore(), 'skills', id),
      skillData(ownerUid, overrides),
    ),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

describe('skills: reads', () => {
  it('lets the owner read their own skill', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'skills', 'alice-skill')))
  })

  it('refuses another user and a signed-out reader', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertFails(getDoc(doc(asBob(), 'skills', 'alice-skill')))
    await assertFails(getDoc(doc(asGuest(), 'skills', 'alice-skill')))
  })

  it('allows the owner-scoped list query the app runs', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertSucceeds(
      getDocs(
        query(collection(asAlice(), 'skills'), where('owner_uid', '==', ALICE)),
      ),
    )
  })

  it('refuses a list query that is not scoped to the caller', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertFails(getDocs(collection(asAlice(), 'skills')))
    await assertFails(
      getDocs(
        query(collection(asBob(), 'skills'), where('owner_uid', '==', ALICE)),
      ),
    )
  })
})

describe('skills: create', () => {
  it('accepts the shape the app writes, with a server timestamp', async () => {
    await assertSucceeds(
      setDoc(doc(asAlice(), 'skills', 'new-skill'), skillData(ALICE)),
    )
  })

  it('refuses a document owned by someone else', async () => {
    await assertFails(
      setDoc(doc(asAlice(), 'skills', 'new-skill'), skillData(BOB)),
    )
  })

  it.each([
    ['an unknown field', { xp: 9000 }],
    ['an unknown realm', { realm: 'moon' }],
    ['an empty name', { name: '' }],
    ['a name over 60 characters', { name: 'x'.repeat(61) }],
    ['a non-boolean archived flag', { archived: 'no' }],
    ['a created_at that is not a timestamp', { created_at: 'yesterday' }],
    ['a created_at in the past', { created_at: CREATED_AT }],
    ['a created_at in the future', { created_at: inAnHour() }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(
      setDoc(doc(asAlice(), 'skills', 'new-skill'), skillData(ALICE, overrides)),
    )
  })

  it('refuses a document with a required field missing', async () => {
    const { realm: _realm, ...withoutRealm } = skillData(ALICE)

    await assertFails(setDoc(doc(asAlice(), 'skills', 'new-skill'), withoutRealm))
  })
})

describe('skills: update and delete', () => {
  it('lets the owner rename and archive', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'skills', 'alice-skill'), {
        name: 'English',
        archived: true,
      }),
    )
  })

  it('accepts a full rewrite that keeps the stored created_at', async () => {
    await seedSkill('alice-skill', ALICE, { created_at: CREATED_AT })

    await assertSucceeds(
      setDoc(
        doc(asAlice(), 'skills', 'alice-skill'),
        skillData(ALICE, { name: 'English', created_at: CREATED_AT }),
      ),
    )
  })

  it.each([
    ['an earlier time', new Date('2020-01-01T00:00:00Z')],
    ['the server clock', serverTimestamp()],
  ])('refuses moving created_at to %s', async (_label, createdAt) => {
    await seedSkill('alice-skill', ALICE, { created_at: CREATED_AT })

    await assertFails(
      updateDoc(doc(asAlice(), 'skills', 'alice-skill'), {
        created_at: createdAt,
      }),
    )
  })

  it('refuses handing the skill to another user', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'skills', 'alice-skill'), { owner_uid: BOB }),
    )
  })

  it('refuses another user updating or deleting it', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'skills', 'alice-skill'), { name: 'Mine now' }),
    )
    await assertFails(deleteDoc(doc(asBob(), 'skills', 'alice-skill')))
  })

  it('lets the owner delete', async () => {
    await seedSkill('alice-skill', ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'skills', 'alice-skill')))
  })
})
