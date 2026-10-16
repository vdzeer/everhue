import styled, { css } from 'styled-components'

const rowButton = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
`

export const Head = styled.button`
  ${rowButton}
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
`

export const ActivityRow = styled.button<{ $selected: boolean }>`
  ${rowButton}
  min-height: ${({ theme }) => theme.sizes.controlLarge};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.lg};
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.background : 'transparent'};
`

export const Empty = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
`

export const Pill = styled.span`
  padding: ${({ theme }) => theme.spacing.xxs}
    ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
`

export const Name = styled.span`
  flex: 1 1 ${({ theme }) => theme.sizes.navItem};
  min-width: 0;
`

export const Tail = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  color: ${({ theme }) => theme.colors.onSurfaceMuted};
`
