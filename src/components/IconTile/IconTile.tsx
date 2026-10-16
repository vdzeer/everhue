import type { Realm } from '~/core'

import { Icon, type IconName } from '../Icon'

import { Tile } from './styled'

export const REALM_ICON: Record<Realm, IconName> = {
  library: 'book',
  forge: 'dumbbell',
  harbor: 'bubble',
  neon: 'code',
  gardens: 'moon',
  bay: 'coin',
}

type Props = {
  realm: Realm | undefined
  /** Instead of the realm's own icon. */
  icon?: IconName
  /** Idle tiles are gray. */
  active?: boolean
  small?: boolean
}

export const IconTile = ({
  realm,
  icon,
  active = true,
  small = false,
}: Props) => (
  <Tile $realm={realm} $active={active} $small={small}>
    <Icon name={icon ?? (realm ? REALM_ICON[realm] : 'plan')} />
  </Tile>
)
