import { Button, Grow, Icon, Text } from '~/components'
import type { Quest } from '~/core'
import { unitLabel } from '~/features/tracking/services'
import { formatAmount } from '~/services/format'
import { useT } from '~/services/i18n'

import { Badge, Wrap } from './styled'

type Props = {
  quest: Quest
  /** XP earned by today's logs of this activity. */
  xp: number
  /** Removes the latest log, which is how a mistake is taken back. */
  onUndo: (quest: Quest) => void
}

export const DoneRow = ({ quest, xp, onUndo }: Props) => {
  const t = useT()
  const { activity, skill } = quest

  return (
    <Wrap $realm={skill?.realm}>
      <Badge $realm={skill?.realm}>
        <Icon name="check" size="sm" />
      </Badge>
      <Grow>
        <Text variant="bodyStrong">{activity.name}</Text>
      </Grow>
      {activity.kind === 'check' ? null : (
        <Text variant="secondary">
          {`${formatAmount(quest.done)} ${unitLabel(activity, t)}`}
        </Text>
      )}
      <Text variant="label">{t('xp_gain', { xp })}</Text>
      <Button
        variant="ghost"
        icon="undo"
        aria-label={`${t('action_undo')}: ${activity.name}`}
        onClick={() => onUndo(quest)}
      />
    </Wrap>
  )
}
