import styled from 'styled-components'

export const Scene = styled.div<{ $large: boolean }>`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: ${({ theme, $large }) =>
    $large ? theme.sizes.heroSceneLarge : theme.sizes.heroScene};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.sceneSky};
  overflow: hidden;
`

export const Ground = styled.div<{ $large: boolean }>`
  position: absolute;
  inset: auto 0 0 0;
  height: ${({ theme, $large }) =>
    $large ? theme.sizes.heroGroundLarge : theme.sizes.heroGround};
  background: ${({ theme }) => theme.colors.sceneGround};
`

/** The one strip of colour in a gray world: it sits under the hero's feet. */
export const Glow = styled.div<{ $large: boolean }>`
  position: absolute;
  bottom: ${({ theme, $large }) =>
    $large ? theme.spacing.xl : theme.spacing.lg};
  left: 50%;
  width: 60%;
  max-width: ${({ theme }) => theme.sizes.heroScene};
  height: ${({ theme }) => theme.sizes.bar};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  transform: translateX(-50%);
`

export const Standing = styled.div<{ $large: boolean }>`
  position: relative;
  margin-bottom: ${({ theme, $large }) =>
    $large ? theme.spacing.xl : theme.spacing.lg};
  line-height: 0;
`
