import styled from 'styled-components'

import { narrow } from '~/themes'

export const Page = styled.div`
  display: flex;
  flex-wrap: wrap;
  min-height: 100vh;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.surface};

  ${narrow} {
    align-content: flex-start;
  }
`

export const Scene = styled.div`
  position: relative;
  flex: 1 1 ${({ theme }) => theme.sizes.signInScene};
  min-height: ${({ theme }) => theme.sizes.signInScene};
  background: ${({ theme }) => theme.colors.sceneSky};
  overflow: hidden;

  /* On a phone the scene is a header, so the sign-in button stays in view. */
  ${narrow} {
    flex-basis: 100%;
    min-height: ${({ theme }) => theme.sizes.heroSceneLarge};
  }
`

/** Soft gray shapes: the world without its colour. */
export const Hill = styled.div<{ $side: 'left' | 'right' }>`
  position: absolute;
  bottom: 14%;
  ${({ $side }) => ($side === 'left' ? 'left: 6%;' : 'right: 4%;')}
  width: ${({ theme }) => theme.sizes.heroSceneLarge};
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.sceneGround};
`

export const Tower = styled.div`
  position: absolute;
  bottom: 30%;
  left: 16%;
  width: ${({ theme }) => theme.sizes.weekBar};
  height: 34%;
  border-radius: ${({ theme }) => theme.radii.lg}
    ${({ theme }) => theme.radii.lg} 0 0;
  background: ${({ theme }) => theme.colors.sceneShape};
`

export const House = styled.div`
  position: absolute;
  right: 12%;
  bottom: 30%;
  width: 22%;
  height: 16%;
  border-radius: ${({ theme }) => theme.radii.lg}
    ${({ theme }) => theme.radii.lg} 0 0;
  background: ${({ theme }) => theme.colors.sceneShape};
`

export const Ground = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  height: 30%;
  background: ${({ theme }) => theme.colors.sceneGround};
`

export const Glow = styled.div`
  position: absolute;
  bottom: calc(18% - ${({ theme }) => theme.spacing.xs});
  left: 50%;
  width: ${({ theme }) => theme.sizes.textColumn};
  height: ${({ theme }) => theme.sizes.barLarge};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  transform: translateX(-50%);

  ${narrow} {
    width: ${({ theme }) => theme.sizes.heroScene};
  }
`

export const Standing = styled.div`
  position: absolute;
  bottom: 18%;
  left: 50%;
  line-height: 0;
  transform: translateX(-50%);

  /* 10 of the sprite's 16 screen pixels each: still whole pixels, and the
     whole figure fits the shorter scene. */
  ${narrow} {
    transform: translateX(-50%) scale(0.625);
    transform-origin: bottom center;
  }
`

export const Panel = styled.main`
  flex: 1 1 ${({ theme }) => theme.sizes.signInScene};
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xxl};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.xxxl}
    clamp(
      ${({ theme }) => theme.spacing.lg},
      6vw,
      ${({ theme }) => theme.spacing.xxxl}
    )
    calc(
      ${({ theme }) => theme.spacing.xxxl} +
        ${({ theme }) => theme.insets.bottom}
    );

  ${narrow} {
    justify-content: flex-start;
    gap: ${({ theme }) => theme.spacing.xl};
    padding-top: ${({ theme }) => theme.spacing.xl};
  }
`

export const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: ${({ theme }) => theme.sizes.signInText};
`

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: ${({ theme }) => theme.sizes.signInActions};
`
