import { useTheme } from 'styled-components'

import { Card, HeroScene, ProgressBar, Row, Stack, Text } from '~/components'
import { FREEZE_MAX, type HeroView } from '~/core'
import { durationLabel } from '~/features/tracking/services'
import { formatPercent } from '~/services/format'
import { useT } from '~/services/i18n'

import { Stat, Stats } from './styled'

type Props = {
  hero: HeroView
  /** The Hero screen shows the big scene and the three numbers under it. */
  large?: boolean
}

export const HeroCard = ({ hero, large = false }: Props) => {
  const t = useT()
  const theme = useTheme()
  const { level, intoLevel, span, toNext, ratio } = hero.hero

  return (
    <Card aria-label={t('nav_hero')}>
      <Stack>
        <HeroScene label={t('hero_sprite_label')} large={large} />
        <Row $justify="space-between" $align="baseline">
          <Text variant={large ? 'hero' : 'title'}>
            {t('hero_level', { level })}
          </Text>
          <Text variant="secondary" tone="muted">
            {t('hero_xp', { xp: intoLevel, next: span })}
          </Text>
        </Row>
        <ProgressBar
          large
          ratio={ratio}
          color={theme.colors.accent}
          label={t('level_progress_label', { percent: formatPercent(ratio) })}
        />
        {large ? (
          <Stats>
            <Stat>
              <Text variant="stat">{hero.streak}</Text>
              <Text variant="caption" tone="muted">
                {t('streak_label')}
              </Text>
            </Stat>
            <Stat>
              <Text variant="stat">{formatPercent(hero.consistency)}</Text>
              <Text variant="caption" tone="muted">
                {t('stat_consistency')}
              </Text>
            </Stat>
            <Stat>
              <Text variant="stat">{durationLabel(hero.weekMinutes, t)}</Text>
              <Text variant="caption" tone="muted">
                {t('stat_week')}
              </Text>
            </Stat>
          </Stats>
        ) : (
          <Text variant="secondary" tone="muted">
            {t('hero_to_next', { xp: toNext, level: level + 1 })}
          </Text>
        )}
        {large ? (
          <Text variant="caption" tone="muted">
            {t('freeze_hint', { count: hero.freezes, max: FREEZE_MAX })}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}
