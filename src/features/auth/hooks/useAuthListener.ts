import { useQueryClient } from '@tanstack/react-query'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect } from 'react'

import { forgetLocalData, getFirebase } from '~/services/firebase'
import { useAuthStore } from '~/store'

/** The single writer of the auth state. Mounted once, at the root. */
export const useAuthListener = () => {
  const queryClient = useQueryClient()
  const setUser = useAuthStore(state => state.setUser)

  useEffect(() => {
    let signedIn = false

    return onAuthStateChanged(getFirebase().auth, user => {
      // Another account's data must not survive in memory after sign-out.
      if (!user) queryClient.clear()
      setUser(user ? { uid: user.uid, email: user.email } : null)

      // Nor on disk. Sign-out here, in another tab or by deleting the
      // account all end the same way: the Firestore cache is deleted and
      // the page starts again from nothing.
      if (signedIn && !user) {
        forgetLocalData()
          .catch((error: unknown) => console.error(error))
          .finally(() => window.location.reload())
      }
      signedIn = user !== null
    })
  }, [queryClient, setUser])
}
