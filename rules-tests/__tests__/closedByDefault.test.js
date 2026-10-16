const { assertFails } = require('@firebase/rules-unit-testing')
const { doc, getDoc, setDoc } = require('firebase/firestore')

const { ALICE, setupTestEnv, skillData } = require('../helpers')

// The catch-all `match /{document=**}` at the bottom of the rules file. A
// collection nobody wrote a rule for is closed, so adding one to the app is a
// deliberate act rather than an accident.

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

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()

describe('collections with no rule of their own', () => {
  it.each([['users'], ['parties'], ['entitlements']])(
    'refuses reads and writes on %s',
    async collectionId => {
      await assertFails(getDoc(doc(asAlice(), collectionId, ALICE)))
      await assertFails(
        setDoc(doc(asAlice(), collectionId, ALICE), { owner_uid: ALICE }),
      )
    },
  )

  it('refuses a subcollection under a skill the user owns', async () => {
    await testEnv.withSecurityRulesDisabled(context =>
      setDoc(doc(context.firestore(), 'skills', 'alice-skill'), skillData(ALICE)),
    )

    await assertFails(
      getDoc(doc(asAlice(), 'skills', 'alice-skill', 'notes', 'note-1')),
    )
  })
})
