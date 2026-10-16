import styled from 'styled-components'

import type { Realm } from '~/core'

/* A finished quest is where colour arrives: the whole row takes the tint. */
export const Wrap = styled.div<{ $realm: Realm | undefined }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.xs}
    ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme, $realm }) =>
    $realm ? theme.realms[$realm].tint : theme.colors.surfaceSunken};
`

export const Badge = styled.span<{ $realm: Realm | undefined }>`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.sizes.badge};
  height: ${({ theme }) => theme.sizes.badge};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $realm }) =>
    $realm ? theme.realms[$realm].ink : theme.colors.onSurfaceMuted};
  color: ${({ theme }) => theme.colors.onPrimary};
`
