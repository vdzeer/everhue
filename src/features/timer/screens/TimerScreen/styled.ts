import Link from 'next/link'
import styled from 'styled-components'

import type { Realm } from '~/core'

export const BackLink = styled(Link)`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: ${({ theme }) => theme.sizes.control};
  color: ${({ theme }) => theme.colors.onSurfaceMuted};
  text-decoration: none;
`

export const ClockCard = styled.section`
  flex: 2 1 ${({ theme }) => theme.sizes.columnWide};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.xxl}
    ${({ theme }) => theme.spacing.lg};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
`

export const Wide = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const Buttons = styled.div`
  align-self: stretch;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
`

export const PartsColumn = styled.div`
  flex: 1 1 ${({ theme }) => theme.sizes.columnNarrow};
  min-width: 0;
`

export const PartRow = styled.div<{
  $state: 'done' | 'active' | 'idle'
  $realm: Realm | undefined
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme, $state }) => {
      if ($state === 'active') return theme.colors.primary
      if ($state === 'done') return 'transparent'
      return theme.colors.border
    }};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme, $state, $realm }) => {
    if ($state !== 'done') return 'transparent'
    return $realm ? theme.realms[$realm].tint : theme.colors.surfaceSunken
  }};
`
