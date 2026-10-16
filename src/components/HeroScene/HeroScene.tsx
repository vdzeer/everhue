import { HeroSprite } from '../HeroSprite'

import { Glow, Ground, Scene, Standing } from './styled'

type Props = {
  label: string
  large?: boolean
}

export const HeroScene = ({ label, large = false }: Props) => (
  <Scene $large={large}>
    <Ground $large={large} />
    <Glow $large={large} />
    <Standing $large={large}>
      <HeroSprite scale={large ? 12 : 8} label={label} />
    </Standing>
  </Scene>
)
