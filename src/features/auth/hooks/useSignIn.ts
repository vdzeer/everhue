import {
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
} from 'firebase/auth'
import { useCallback, useState } from 'react'

import { USE_EMULATORS, getFirebase } from '~/services/firebase'

// Closing the popup is a decision, not a failure worth a message.
const QUIET_CODES = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]

export const useSignIn = () => {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const signIn = useCallback(async () => {
    setPending(true)
    setFailed(false)
    try {
      await signInWithPopup(getFirebase().auth, new GoogleAuthProvider())
    } catch (error) {
      const code = (error as { code?: string }).code ?? ''
      if (!QUIET_CODES.includes(code)) {
        console.error(error)
        setFailed(true)
      }
    } finally {
      setPending(false)
    }
  }, [])

  /**
   * Anonymous sign-in exists for local development only: it works against the
   * Auth emulator and is never offered when the app talks to a real project.
   */
  const signInForDevelopment = useCallback(async () => {
    if (!USE_EMULATORS) return
    await signInAnonymously(getFirebase().auth)
  }, [])

  return {
    signIn,
    pending,
    failed,
    signInForDevelopment: USE_EMULATORS ? signInForDevelopment : null,
  }
}
