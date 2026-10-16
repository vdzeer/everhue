import styled from 'styled-components'

import type { Realm } from '~/core'

export const Wrap = styled.article`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
`

export const Body = styled.div`
  flex: 1 1 ${({ theme }) => theme.sizes.textColumn};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`

export const Actions = styled.div`
  flex: none;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

export const PartChip = styled.span<{
  $done: boolean
  $realm: Realm | undefined
}>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
  padding: ${({ theme }) => theme.spacing.xxs}
    ${({ theme }) => theme.spacing.sm};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme, $done }) => ($done ? 'transparent' : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $done, $realm }) => {
    if (!$done) return 'transparent'
    return $realm ? theme.realms[$realm].tint : theme.colors.surfaceSunken
  }};
  color: ${({ theme, $done }) =>
    $done ? theme.colors.onSurface : theme.colors.onSurfaceMuted};
`

export const InlineForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding-top: ${({ theme }) => theme.spacing.xxs};
`
