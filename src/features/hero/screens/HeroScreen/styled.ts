import styled from 'styled-components'

export const SkillRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

export const HeroColumn = styled.div`
  flex: 1 1 ${({ theme }) => theme.sizes.columnNarrow};
  min-width: 0;
`

export const SkillsColumn = styled.div`
  flex: 2 1 ${({ theme }) => theme.sizes.columnWide};
  min-width: 0;
`
