import styled from 'styled-components'

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  min-width: 0;
`

export const StepRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

export const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
`

/* An activity that counts towards the goal is filled, not only tinted. */
export const Choice = styled.button<{ $picked: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.sizes.control};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme, $picked }) =>
      $picked ? theme.colors.primary : theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $picked }) =>
    $picked ? theme.colors.primary : theme.colors.surface};
  color: ${({ theme, $picked }) =>
    $picked ? theme.colors.onPrimary : theme.colors.onSurface};
  text-align: left;
  cursor: pointer;

  &:disabled {
    border-color: ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surfaceSunken};
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
    cursor: not-allowed;
  }
`
