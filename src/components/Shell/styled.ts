import Link from 'next/link'
import styled from 'styled-components'

import { narrow } from '~/themes'

export const Frame = styled.div`
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.background};
`

/* The menu is a side column on a wide screen and a tab bar along the bottom
   edge of a narrow one, where a thumb reaches it. */
export const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  align-self: flex-start;
  flex: 0 0 ${({ theme }) => theme.sizes.sidebar};
  display: flex;
  height: 100vh;
  height: 100dvh;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  border-right: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceSubtle};

  ${narrow} {
    position: fixed;
    z-index: 1;
    inset: auto 0 0 0;
    height: auto;
    padding: ${({ theme }) => theme.spacing.xxs}
      max(
        ${({ theme }) => theme.spacing.xs},
        ${({ theme }) => theme.insets.right}
      )
      calc(
        ${({ theme }) => theme.spacing.xxs} +
          ${({ theme }) => theme.insets.bottom}
      )
      max(
        ${({ theme }) => theme.spacing.xs},
        ${({ theme }) => theme.insets.left}
      );
    border-right: none;
    border-top: ${({ theme }) => theme.sizes.hairline} solid
      ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
  }
`

export const Brand = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.sm};

  ${narrow} {
    display: none;
  }
`

export const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};

  ${narrow} {
    flex-direction: row;
  }
`

export const NavLink = styled(Link)<{
  $active: boolean
  /** Lit in the phone's tab bar, where Settings has no tab of its own. */
  $activeTab: boolean
  /** Shown in the side menu only, at its foot. */
  $wideOnly: boolean
}>`
  display: flex;
  margin-top: ${({ $wideOnly }) => ($wideOnly ? 'auto' : '0')};
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.sizes.control};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  /* The current section is filled, so it does not rely on colour alone. */
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.onPrimary : theme.colors.onSurface};
  text-decoration: none;

  ${narrow} {
    display: ${({ $wideOnly }) => ($wideOnly ? 'none' : 'flex')};
    flex: 1 1 0;
    flex-direction: column;
    margin-top: 0;
    background: ${({ theme, $activeTab }) =>
      $activeTab ? theme.colors.primary : 'transparent'};
    color: ${({ theme, $activeTab }) =>
      $activeTab ? theme.colors.onPrimary : theme.colors.onSurface};
    justify-content: center;
    gap: 0;
    min-width: 0;
    min-height: ${({ theme }) => theme.sizes.controlLarge};
    padding: ${({ theme }) => theme.spacing.xxs};
    text-align: center;
  }
`

export const Main = styled.main`
  flex: 1 1 0;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.xxl}
    clamp(
      ${({ theme }) => theme.spacing.md},
      4vw,
      ${({ theme }) => theme.spacing.xxxl}
    )
    ${({ theme }) => theme.spacing.xxxl};

  ${narrow} {
    padding: calc(
        ${({ theme }) => theme.spacing.lg} + ${({ theme }) => theme.insets.top}
      )
      max(
        ${({ theme }) => theme.spacing.md},
        ${({ theme }) => theme.insets.right}
      )
      calc(
        ${({ theme }) => theme.sizes.tabBar} +
          ${({ theme }) => theme.spacing.lg} +
          ${({ theme }) => theme.insets.bottom}
      )
      max(
        ${({ theme }) => theme.spacing.md},
        ${({ theme }) => theme.insets.left}
      );
  }
`

export const Content = styled.div<{ $narrow: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: ${({ theme, $narrow }) =>
    $narrow ? theme.sizes.contentNarrow : theme.sizes.content};
  margin: 0 auto;
`

export const Banner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.dangerSoft};
`
