import styled from 'styled-components'

import type { Realm } from '~/core'

export const Wrap = styled.article<{
  $reached: boolean
  $realm: Realm | undefined
}>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme, $reached }) => ($reached ? 'transparent' : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.xl};
  /* Colour belongs to what is done: a reached goal sits on its tint. */
  background: ${({ theme, $reached, $realm }) => {
    if (!$reached) return theme.colors.surface
    return $realm ? theme.realms[$realm].tint : theme.colors.accentSoft
  }};
`

export const Head = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

export const Pill = styled.span`
  flex: none;
  padding: ${({ theme }) => theme.spacing.xxs}
    ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
`

export const Steps = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  margin: 0;
  padding: 0;
  list-style: none;
`

export const StepButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  min-height: ${({ theme }) => theme.sizes.control};
  padding: ${({ theme }) => theme.spacing.xxs} 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
`

/* A step that is done is a filled box with a tick, not just a colour. */
export const Box = styled.span<{ $done: boolean }>`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.sizes.badge};
  height: ${({ theme }) => theme.sizes.badge};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme, $done }) =>
      $done ? theme.colors.primary : theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $done }) =>
    $done ? theme.colors.primary : theme.colors.surface};
  color: ${({ theme }) => theme.colors.onPrimary};
`

export const InlineForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.xs};
`

export const AmountField = styled.div`
  flex: 1 1 ${({ theme }) => theme.sizes.numberField};
  min-width: ${({ theme }) => theme.sizes.numberField};
`
