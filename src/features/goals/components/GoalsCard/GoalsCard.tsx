import { useTheme } from 'styled-components'

import { Button, Card, ProgressBar, Row, Stack, Text } from '~/components'
import type { GoalProgress } from '~/core'
import { formatPercent } from '~/services/format'
import { ROUTES } from '~/types'

import { goalProgressLabel, goalRealm, type GoalContext } from '../../services'

type Props = {
  /** The goals to show, most pressing first. */
  items: GoalProgress[]
  context: GoalContext
}

/** The goals at a glance, for the side of the Today screen. */
export const GoalsCard = ({ items, context }: Props) => {
  const { t } = context
  const theme = useTheme()

  return (
    <Card aria-label={t('goals_title')}>
      <Stack>
        <Row $justify="space-between" $align="baseline">
          <Text as="h2" variant="subtitle">
            {t('goals_title')}
          </Text>
          <Button variant="ghost" href={ROUTES.Goals}>
            {t('goals_all')}
          </Button>
        </Row>
        {items.map(progress => {
          const realm = goalRealm(progress.goal, context)
          return (
            <Stack key={progress.goal.id} $gap="xxs">
              <Row $justify="space-between" $align="baseline" $gap="xs">
                <Text variant="label">{progress.goal.name}</Text>
                <Text variant="caption" tone="muted">
                  {goalProgressLabel(progress, context)}
                </Text>
              </Row>
              <ProgressBar
                ratio={progress.ratio}
                color={
                  realm ? theme.realms[realm].solid : theme.colors.accentStrong
                }
                label={`${progress.goal.name}: ${t('progress_label', {
                  percent: formatPercent(progress.ratio),
                })}`}
              />
            </Stack>
          )
        })}
      </Stack>
    </Card>
  )
}
