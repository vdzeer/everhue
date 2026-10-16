import styled from 'styled-components'

import type { HeatLevel } from '~/core'

export const Scroll = styled.div`
  overflow-x: auto;
`

/* Columns are weeks, rows are weekdays. */
export const Grid = styled.div`
  display: grid;
  grid-template-rows: repeat(7, ${({ theme }) => theme.sizes.iconSmall});
  grid-auto-flow: column;
  grid-auto-columns: ${({ theme }) => theme.sizes.iconSmall};
  gap: ${({ theme }) => theme.spacing.xxs};
  width: max-content;
`

const LEVEL_COLOR = {
  0: 'surfaceSunken',
  1: 'heatLow',
  2: 'heatMid',
  3: 'heatHigh',
} as const

export const Cell = styled.div<{ $level: HeatLevel; $future: boolean }>`
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme, $future }) => ($future ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme, $level, $future }) =>
    $future ? 'transparent' : theme.colors[LEVEL_COLOR[$level]]};
`

export const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

export const Swatch = styled.span<{ $level: HeatLevel }>`
  width: ${({ theme }) => theme.sizes.swatch};
  height: ${({ theme }) => theme.sizes.swatch};
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme, $level }) => theme.colors[LEVEL_COLOR[$level]]};
`
