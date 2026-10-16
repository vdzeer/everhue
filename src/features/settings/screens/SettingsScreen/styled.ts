import styled from 'styled-components'

export const Divider = styled.div`
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
`
