import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  ReCaptchaEnterpriseProvider,
  initializeAppCheck,
} from 'firebase/app-check'
import { connectAuthEmulator, getAuth, signOut, type Auth } from 'firebase/auth'
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  waitForPendingWrites,
  type Firestore,
} from 'firebase/firestore'

// The one file that creates Firebase clients. Everything else asks for them
// here, so emulator wiring and cache settings cannot drift between callers.

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_EMULATORS === '1'

/** A reCAPTCHA Enterprise site key turns App Check on; empty leaves it off. */
const APPCHECK_SITE_KEY = process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY ?? ''

/** How long sign-out waits for unsent writes to reach the server. */
const PENDING_WRITES_WAIT_MS = 5000

const EMULATOR_HOST = '127.0.0.1'
const AUTH_EMULATOR_PORT = 9099
const FIRESTORE_EMULATOR_PORT = 8080

type Clients = { auth: Auth; db: Firestore }

let clients: Clients | null = null

const createFirestore = (app: ReturnType<typeof getApp>) => {
  try {
    // The persistent cache is what lets a log written offline survive a
    // reload and reach the server later.
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    // Already initialised (a hot reload re-evaluated this module).
    return getFirestore(app)
  }
}

/** Browser only: call from effects, event handlers and query functions. */
export const getFirebase = (): Clients => {
  if (clients) return clients

  const firstRun = getApps().length === 0
  const app = firstRun ? initializeApp(config) : getApp()

  // Before Auth and Firestore, so their requests carry a token. Whether the
  // token is required is a switch in the Firebase console, not here. The
  // emulators do not check it, and the key would not attest on localhost.
  if (firstRun && APPCHECK_SITE_KEY && !USE_EMULATORS) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  }

  const auth = getAuth(app)
  const db = createFirestore(app)

  if (USE_EMULATORS && firstRun) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
      disableWarnings: true,
    })
    connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT)
  }

  clients = { auth, db }
  return clients
}

/**
 * Signs out once unsent writes have reached the server, or after a few
 * seconds offline: the cache is cleared next, and what it still holds is
 * lost then.
 */
export const signOutUser = async () => {
  const { auth, db } = getFirebase()
  await Promise.race([
    waitForPendingWrites(db).catch(() => undefined),
    new Promise(resolve => setTimeout(resolve, PENDING_WRITES_WAIT_MS)),
  ])
  await signOut(auth)
}

/**
 * Stops Firestore and deletes its IndexedDB cache, so whoever uses this
 * browser next finds nothing of the account that signed out. Other tabs
 * lose their Firestore too. Nothing works afterwards: the caller reloads.
 */
export const forgetLocalData = async () => {
  if (!clients) return
  const { db } = clients
  clients = null
  await terminate(db)
  await clearIndexedDbPersistence(db)
}
