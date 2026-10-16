import {
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithPopup,
  type User,
} from 'firebase/auth'
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'

import { COLLECTIONS } from '~/features/tracking/hooks'
import { getFirebase } from '~/services/firebase'

/** A batch holds 500 writes; staying under it leaves room for nothing else. */
const BATCH_SIZE = 400

const chunk = <Item>(items: Item[], size: number): Item[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  )

const deleteOwned = async (name: string, uid: string) => {
  const { db } = getFirebase()
  const snapshot = await getDocs(
    query(collection(db, name), where('owner_uid', '==', uid)),
  )

  // One batch after another: a failure stops here with the rest untouched,
  // and running the deletion again picks up where it left off.
  await chunk<QueryDocumentSnapshot>(snapshot.docs, BATCH_SIZE).reduce(
    (previous, documents) =>
      previous.then(() => {
        const batch = writeBatch(db)
        documents.forEach(document => batch.delete(document.ref))
        return batch.commit()
      }),
    Promise.resolve(),
  )
}

const deleteSignIn = async (user: User) => {
  try {
    await deleteUser(user)
  } catch (error) {
    // Firebase refuses to delete a sign-in that is not fresh.
    if ((error as { code?: string }).code !== 'auth/requires-recent-login') {
      throw error
    }
    await reauthenticateWithPopup(user, new GoogleAuthProvider())
    await deleteUser(user)
  }
}

/**
 * Data first, sign-in last: a deletion that stops half-way can always be run
 * again, because the user can still sign in to finish it. Unlike ordinary
 * writes this one is awaited, since it only makes sense online.
 */
export const deleteAccount = async () => {
  const { auth } = getFirebase()
  const user = auth.currentUser
  if (!user) throw new Error('not signed in')

  await Promise.all(
    Object.values(COLLECTIONS).map(name => deleteOwned(name, user.uid)),
  )
  await deleteSignIn(user)
}
