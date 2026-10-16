import { rootView } from '../rootView'

describe('rootView', () => {
  it('shows nothing but the page colour until the auth state is known', () => {
    expect(rootView('unknown')).toBe('splash')
  })

  it('shows sign-in only once the user is known to be signed out', () => {
    expect(rootView('signed_out')).toBe('signin')
  })

  it('shows the app to a signed-in user', () => {
    expect(rootView('signed_in')).toBe('app')
  })
})
