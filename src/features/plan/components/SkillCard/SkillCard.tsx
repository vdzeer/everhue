import { Card, Icon, IconTile, Text } from '~/components'
import type { Activity, Skill } from '~/core'
import { activityMeta } from '~/features/tracking/services'
import { useT } from '~/services/i18n'

import { ActivityRow, Empty, Head, Name, Pill, Tail } from './styled'

type Props = {
  skill: Skill
  level: number
  activities: Activity[]
  /** The activity open in the editor, if it belongs to this skill. */
  selectedActivityId: string | null
  onEditSkill: (skill: Skill) => void
  onEditActivity: (activity: Activity) => void
}

export const SkillCard = ({
  skill,
  level,
  activities,
  selectedActivityId,
  onEditSkill,
  onEditActivity,
}: Props) => {
  const t = useT()

  return (
    <Card $padding="none" aria-label={skill.name}>
      <Head
        type="button"
        aria-label={`${t('plan_edit_skill')}: ${skill.name}`}
        onClick={() => onEditSkill(skill)}>
        <IconTile realm={skill.realm} small />
        <Name>
          <Text as="h2" variant="subtitle">
            {skill.name}
          </Text>
        </Name>
        <Text variant="secondary" tone="muted">
          {t('hero_level', { level })}
        </Text>
      </Head>

      {activities.length === 0 ? (
        <Empty>
          <Text variant="secondary" tone="muted">
            {t('plan_no_activities')}
          </Text>
        </Empty>
      ) : null}

      {activities.map(activity => {
        const selected = activity.id === selectedActivityId
        return (
          <ActivityRow
            key={activity.id}
            type="button"
            aria-pressed={selected}
            $selected={selected}
            onClick={() => onEditActivity(activity)}>
            <Name>
              <Text variant="bodyStrong">{activity.name}</Text>
            </Name>
            <Tail>
              <Text variant="secondary" tone="inherit">
                {activityMeta(activity, t)}
              </Text>
              {selected ? (
                <Pill>
                  <Text variant="caption" tone="inherit">
                    {t('plan_editing')}
                  </Text>
                </Pill>
              ) : (
                <Icon name="chevron" size="sm" />
              )}
            </Tail>
          </ActivityRow>
        )
      })}
    </Card>
  )
}
