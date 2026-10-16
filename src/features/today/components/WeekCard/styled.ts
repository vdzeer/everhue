import styled from 'styled-components'

export const Days = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.xs};
`

export const Day = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`

export const Column = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: ${({ theme }) => theme.sizes.weekBar};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surfaceSunken};
  overflow: hidden;
`

export const Bar = styled.div<{ $ratio: number }>`
  width: 100%;
  height: ${({ $ratio }) => `${Math.round($ratio * 100)}%`};
  background: ${({ theme }) => theme.colors.primary};
`
