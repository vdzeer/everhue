import styled from 'styled-components'

import type { Realm } from '~/core'

export const Tile = styled.div<{
  $realm: Realm | undefined
  $active: boolean
  $small: boolean
}>`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme, $small }) =>
    $small ? theme.sizes.iconTileSmall : theme.sizes.iconTile};
  height: ${({ theme, $small }) =>
    $small ? theme.sizes.iconTileSmall : theme.sizes.iconTile};
  border-radius: ${({ theme }) => theme.radii.md};
  /* Colour only on what has been started; otherwise the tile stays gray. */
  background: ${({ theme, $realm, $active }) =>
    $realm && $active ? theme.realms[$realm].tint : theme.colors.surfaceSunken};
  color: ${({ theme, $realm, $active }) =>
    $realm && $active ? theme.realms[$realm].ink : theme.colors.onSurfaceMuted};
`
