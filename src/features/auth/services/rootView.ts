import type { AuthStatus } from '~/store'

export type RootView = 'splash' | 'signin' | 'app'

/**
 * What the app shows at the top level. It follows the live auth state, not a
 * stored token, so a returning user is not bounced to sign-in on every load.
 */
export const rootView = (status: AuthStatus): RootView => {
  if (status === 'signed_in') return 'app'
  if (status === 'signed_out') return 'signin'
  return 'splash'
}
