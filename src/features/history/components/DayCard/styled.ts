import styled from 'styled-components'

export const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
`

export const DayName = styled.div`
  &::first-letter {
    text-transform: uppercase;
  }
`

export const Rows = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const EntryRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
`

/* The amount and the XP stay together and never wrap under the name. */
export const Figures = styled.div`
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`
