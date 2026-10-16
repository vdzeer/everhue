'use client'

import type { ReactNode } from 'react'

import { Shell } from '~/components'
import { useLocaleSync } from '~/hooks'
import { useAuthStore } from '~/store'

import { useAuthListener } from '../../hooks'
import { SignInScreen } from '../../screens'
import { rootView } from '../../services'

import { Splash } from './styled'

type Props = {
  children: ReactNode
}

/** The top-level decision: wait, ask to sign in, or show the app. */
export const AuthGate = ({ children }: Props) => {
  useAuthListener()
  const locale = useLocaleSync()
  const view = rootView(useAuthStore(state => state.status))

  if (view === 'splash') return <Splash aria-busy="true" />
  if (view === 'signin') return <SignInScreen locale={locale} />

  return <Shell>{children}</Shell>
}
