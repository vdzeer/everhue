/** Every screen the app has. Navigation goes through these, never raw paths. */
export enum ROUTES {
  Today = '/',
  Plan = '/plan',
  Goals = '/goals',
  Hero = '/hero',
  Settings = '/settings',
  Timer = '/timer',
  History = '/history',
  Week = '/week',
}

/** The phone's bottom bar, in order: do, set up, aim, see the result. */
export const TAB_ROUTES = [
  ROUTES.Today,
  ROUTES.Plan,
  ROUTES.Goals,
  ROUTES.Hero,
] as const

export type TabRoute = (typeof TAB_ROUTES)[number]

/**
 * The side menu of a wide screen: the tabs, and Settings below them. A phone
 * has room for four labels, so there Settings opens from the Hero screen.
 */
export const NAV_ROUTES = [...TAB_ROUTES, ROUTES.Settings] as const

export type NavRoute = (typeof NAV_ROUTES)[number]

const isUnder = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`)

/**
 * Which item of the side menu a path belongs to. The timer, the history and
 * the week in review are all one step away from Today.
 */
export const activeNav = (pathname: string): NavRoute =>
  NAV_ROUTES.find(
    route => route !== ROUTES.Today && isUnder(pathname, route),
  ) ?? ROUTES.Today

/** Which tab of the bottom bar a path belongs to. */
export const activeTab = (pathname: string): TabRoute => {
  const nav = activeNav(pathname)
  return nav === ROUTES.Settings ? ROUTES.Hero : nav
}
