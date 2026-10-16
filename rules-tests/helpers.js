const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

const { initializeTestEnvironment } = require('@firebase/rules-unit-testing')
const { serverTimestamp } = require('firebase/firestore')

// A `demo-` prefixed id keeps firebase-tools in demo mode: no credentials, and
// nothing can reach a real Google Cloud project by accident.
const PROJECT_ID = 'demo-everhue'

const ALICE = 'alice-uid'
const BOB = 'bob-uid'

// Resolved from this file rather than `process.cwd()` so the suite reads the
// same `firestore.rules` the emulator and `firebase deploy` use, whichever
// directory jest was started from.
const RULES_PATH = resolve(__dirname, '..', 'firestore.rules')

/**
 * `initializeTestEnvironment` uploads the rules file, so a syntax error in
 * `firestore.rules` fails here rather than silently loading — starting the
 * emulator is not a syntax gate, this is.
 */
const setupTestEnv = () =>
  initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(RULES_PATH, 'utf8') },
  })

// A fixed creation time for documents seeded with the rules disabled, and
// for checking that a client cannot pick its own.
const CREATED_AT = new Date('2026-10-01T00:00:00Z')

/** A creation time a client picks for itself: an hour ahead of now. */
const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000)

// Shapes that mirror what the app writes on create: the mappers in
// `src/services/firestoreMappers.ts` produce exactly these keys, and
// `created_at` is the server's clock.
const skillData = (ownerUid, overrides = {}) => ({
  owner_uid: ownerUid,
  name: 'Languages',
  realm: 'harbor',
  archived: false,
  created_at: serverTimestamp(),
  ...overrides,
})

const activityData = (ownerUid, overrides = {}) => ({
  owner_uid: ownerUid,
  name: 'English',
  skill_id: 'skill-1',
  kind: 'time',
  target: 10,
  unit: '',
  minutes_per_unit: 1,
  effort_minutes: 0,
  parts: [
    { id: 'p1', name: 'Anki', target: 5 },
    { id: 'p2', name: 'Podcast', target: 5 },
  ],
  schedule: { type: 'daily' },
  archived: false,
  created_at: serverTimestamp(),
  ...overrides,
})

const logData = (ownerUid, overrides = {}) => ({
  owner_uid: ownerUid,
  activity_id: 'activity-1',
  skill_id: 'skill-1',
  day: '2026-10-12',
  kind: 'time',
  value: 5,
  effort_minutes: 5,
  source: 'timer',
  part_id: 'p1',
  created_at: serverTimestamp(),
  ...overrides,
})

const goalData = (ownerUid, overrides = {}) => ({
  owner_uid: ownerUid,
  name: 'Laptop',
  kind: 'money',
  target: 60000,
  activity_ids: [],
  skill_id: '',
  steps: [],
  currency: 'UAH',
  monthly_plan: 5000,
  start_day: '2026-10-12',
  deadline: '2027-06-01',
  archived: false,
  created_at: serverTimestamp(),
  ...overrides,
})

const goalEntryData = (ownerUid, overrides = {}) => ({
  owner_uid: ownerUid,
  goal_id: 'goal-1',
  amount: 5000,
  day: '2026-10-12',
  created_at: serverTimestamp(),
  ...overrides,
})

module.exports = {
  ALICE,
  BOB,
  CREATED_AT,
  PROJECT_ID,
  RULES_PATH,
  activityData,
  goalData,
  goalEntryData,
  inAnHour,
  logData,
  setupTestEnv,
  skillData,
}
