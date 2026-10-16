'use client'

import { useMemo } from 'react'
import { useTheme } from 'styled-components'

import {
  Button,
  Card,
  Columns,
  Grow,
  IconTile,
  NarrowOnly,
  PageHeader,
  ProgressBar,
  Row,
  Stack,
  StatePanel,
  Text,
} from '~/components'
import { buildHeatmap, buildHero } from '~/core'
import { useTrackingData } from '~/features/tracking/hooks'
import { useToday } from '~/hooks'
import { formatPercent } from '~/services/format'
import { useT } from '~/services/i18n'
import { ROUTES } from '~/types'

import { Heatmap, HeroCard } from '../../components'

import { HeroColumn, SkillRow, SkillsColumn } from './styled'

export const HeroScreen = () => {
  const t = useT()
  const theme = useTheme()
  const today = useToday()
  const { state, skills, xpLogs, retry } = useTrackingData()

  const hero = useMemo(
    () => buildHero(skills, xpLogs, today),
    [skills, xpLogs, today],
  )
  const heatmap = useMemo(() => buildHeatmap(xpLogs, today), [xpLogs, today])

  return (
    <>
      <PageHeader>
        <Text as="h1" variant="display" narrowVariant="hero">
          {t('hero_title')}
        </Text>
        {/* A phone's tab bar has no room for Settings; this is the way in. */}
        <NarrowOnly>
          <Button icon="settings" href={ROUTES.Settings}>
            {t('nav_settings')}
          </Button>
        </NarrowOnly>
      </PageHeader>

      {state === 'loading' ? (
        <StatePanel role="status" title={t('state_loading')} />
      ) : null}

      {state === 'error' ? (
        <StatePanel
          role="alert"
          title={t('state_error_title')}
          text={t('state_error_text')}
          actions={<Button onClick={retry}>{t('action_retry')}</Button>}
        />
      ) : null}

      {state === 'ready' ? (
        <>
          <Columns>
            <HeroColumn>
              <HeroCard hero={hero} large />
            </HeroColumn>
            <SkillsColumn>
              <Card aria-label={t('hero_skills')}>
                <Stack $gap="lg">
                  <Text as="h2" variant="title">
                    {t('hero_skills')}
                  </Text>
                  {hero.skills.length === 0 ? (
                    <Stack $gap="sm">
                      <Text tone="muted">{t('hero_empty')}</Text>
                      <Row>
                        <Button variant="primary" href={ROUTES.Plan}>
                          {t('today_empty_action')}
                        </Button>
                      </Row>
                    </Stack>
                  ) : null}
                  {hero.skills.map(({ skill, progress }) => (
                    <SkillRow key={skill.id}>
                      <IconTile realm={skill.realm} active={progress.xp > 0} />
                      <Grow>
                        <Stack $gap="xs">
                          <Row
                            $justify="space-between"
                            $align="baseline"
                            $gap="xs">
                            <Row $align="baseline" $gap="xs">
                              <Text variant="bodyStrong">{skill.name}</Text>
                              <Text variant="secondary" tone="muted">
                                {t('hero_level', { level: progress.level })}
                              </Text>
                            </Row>
                            <Text variant="secondary" tone="muted">
                              {t('skill_progress', {
                                into: progress.intoLevel,
                                span: progress.span,
                                level: progress.level + 1,
                              })}
                            </Text>
                          </Row>
                          <ProgressBar
                            ratio={progress.ratio}
                            color={theme.realms[skill.realm].solid}
                            label={`${t('hero_level', { level: progress.level })}, ${t(
                              'level_progress_label',
                              { percent: formatPercent(progress.ratio) },
                            )}`}
                          />
                        </Stack>
                      </Grow>
                    </SkillRow>
                  ))}
                </Stack>
              </Card>
            </SkillsColumn>
          </Columns>

          <Card aria-label={t('hero_activity')}>
            <Stack>
              <Row $justify="space-between" $align="baseline">
                <Text as="h2" variant="title">
                  {t('hero_activity')}
                </Text>
                <Text variant="secondary" tone="muted">
                  {t('hero_activity_hint')}
                </Text>
              </Row>
              <Heatmap weeks={heatmap} />
              <Row>
                <Button icon="history" href={ROUTES.History}>
                  {t('today_history')}
                </Button>
              </Row>
            </Stack>
          </Card>
        </>
      ) : null}
    </>
  )
}
