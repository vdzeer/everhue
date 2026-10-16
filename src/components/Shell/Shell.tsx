'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { APP_NAME } from '~/services/brand'
import { useT, type TranslationKey } from '~/services/i18n'
import { useSyncStore } from '~/store'
import {
  NAV_ROUTES,
  ROUTES,
  activeNav,
  activeTab,
  type NavRoute,
} from '~/types'

import { Button } from '../Button'
import { Icon, type IconName } from '../Icon'
import { Text } from '../Text'

import {
  Banner,
  Brand,
  Content,
  Frame,
  Main,
  Nav,
  NavLink,
  Sidebar,
} from './styled'

const ITEMS: Record<NavRoute, { icon: IconName; label: TranslationKey }> = {
  [ROUTES.Today]: { icon: 'today', label: 'nav_today' },
  [ROUTES.Plan]: { icon: 'plan', label: 'nav_plan' },
  [ROUTES.Goals]: { icon: 'goal', label: 'nav_goals' },
  [ROUTES.Hero]: { icon: 'hero', label: 'nav_hero' },
  [ROUTES.Settings]: { icon: 'settings', label: 'nav_settings' },
}

type Props = {
  children: ReactNode
}

export const Shell = ({ children }: Props) => {
  const t = useT()
  const pathname = usePathname()
  const failed = useSyncStore(state => state.failed)
  const current = activeNav(pathname)
  const tab = activeTab(pathname)

  return (
    <Frame>
      <Sidebar>
        <Brand>
          <Text variant="title">{APP_NAME}</Text>
        </Brand>
        <Nav aria-label={t('nav_label')}>
          {NAV_ROUTES.map(route => (
            <NavLink
              key={route}
              href={route}
              $active={route === current}
              $activeTab={route === tab}
              $wideOnly={route === ROUTES.Settings}
              aria-current={route === current ? 'page' : undefined}>
              <Icon name={ITEMS[route].icon} />
              <Text
                variant={route === current ? 'bodyStrong' : 'body'}
                narrowVariant="tab"
                tone="inherit">
                {t(ITEMS[route].label)}
              </Text>
            </NavLink>
          ))}
        </Nav>
      </Sidebar>
      <Main>
        <Content $narrow={current === ROUTES.Settings}>
          {failed ? (
            <Banner role="alert">
              <Text>{t('sync_error')}</Text>
              <Button onClick={() => window.location.reload()}>
                {t('sync_reload')}
              </Button>
            </Banner>
          ) : null}
          {children}
        </Content>
      </Main>
    </Frame>
  )
}
