import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { NAV_ROUTES, ROUTES, TAB_ROUTES, activeNav, activeTab } from '../routes'

const APP_DIR = join(__dirname, '..', '..', 'app')

describe('ROUTES', () => {
  it.each(Object.values(ROUTES))('%s has a page', route => {
    expect(existsSync(join(APP_DIR, route, 'page.tsx'))).toBe(true)
  })

  it('has four tabs, each a real route: a phone has room for no more', () => {
    expect(TAB_ROUTES).toHaveLength(4)
    expect(Object.values(ROUTES)).toEqual(
      expect.arrayContaining([...TAB_ROUTES]),
    )
  })

  it('puts Settings in the side menu, after the tabs', () => {
    expect(NAV_ROUTES).toEqual([...TAB_ROUTES, ROUTES.Settings])
  })
})

describe('activeNav', () => {
  it.each([
    ['/', ROUTES.Today],
    ['/plan', ROUTES.Plan],
    ['/goals', ROUTES.Goals],
    ['/hero', ROUTES.Hero],
    ['/settings', ROUTES.Settings],
  ])('%s lights its own item', (pathname, route) => {
    expect(activeNav(pathname)).toBe(route)
  })

  it('keeps the item lit under a trailing slash', () => {
    expect(activeNav('/plan/')).toBe(ROUTES.Plan)
  })

  it('does not mistake a longer name for a section', () => {
    expect(activeNav('/planning')).toBe(ROUTES.Today)
  })

  it('counts the timer and the history as part of Today', () => {
    expect(activeNav(ROUTES.Timer)).toBe(ROUTES.Today)
    expect(activeNav(ROUTES.History)).toBe(ROUTES.Today)
  })

  it('falls back to Today for a path it does not know', () => {
    expect(activeNav('/nowhere')).toBe(ROUTES.Today)
  })
})

describe('activeTab', () => {
  it.each(TAB_ROUTES.map(route => [route]))('%s lights its own tab', route => {
    expect(activeTab(route)).toBe(route)
  })

  it('lights Hero for Settings, which a phone opens from there', () => {
    expect(activeTab(ROUTES.Settings)).toBe(ROUTES.Hero)
  })

  it('always answers with a tab the bar has', () => {
    Object.values(ROUTES).forEach(route => {
      expect(TAB_ROUTES).toContain(activeTab(route))
    })
  })
})
