'use client'

import { useMemo } from 'react'
import { useTheme } from 'styled-components'

import {
  Button,
  Card,
  Columns,
  Grow,
  Icon,
  IconTile,
  ProgressBar,
  Row,
  Stack,
  StatePanel,
  Text,
} from '~/components'
import {
  activeDays,
  buildToday,
  effortFor,
  elapsedMs,
  formatClock,
  isRunning,
  levelForXp,
  loggedMinutes,
  streakBefore,
  xpForEffort,
  computeXp,
  SKILL_LEVEL_COEFF,
} from '~/core'
import { useTrackingActions, useTrackingData } from '~/features/tracking/hooks'
import { durationLabel } from '~/features/tracking/services'
import { useNavigation, useNow, useToday } from '~/hooks'
import { formatAmount } from '~/services/format'
import { useT } from '~/services/i18n'
import { useTimerStore } from '~/store'
import { ROUTES } from '~/types'

import {
  BackLink,
  Buttons,
  ClockCard,
  PartRow,
  PartsColumn,
  Wide,
} from './styled'

const SECOND_MS = 1000
const MINUTE_MS = 60_000

export const TimerScreen = () => {
  const t = useT()
  const theme = useTheme()
  const navigation = useNavigation()
  const today = useToday()
  const now = useNow(SECOND_MS)
  const { state, skills, activities, logs, xpLogs } = useTrackingData()
  const actions = useTrackingActions()
  const { timer, pause, resume, clear } = useTimerStore()

  const quest = useMemo(() => {
    const view = buildToday(activities, skills, logs, today)
    return [...view.pending, ...view.done].find(
      candidate => candidate.activity.id === timer?.activityId,
    )
  }, [activities, skills, logs, today, timer?.activityId])

  // Streaks and levels count contributions to goals too, so they read the
  // XP logs; the quest itself counts only what was logged against it.
  const streak = useMemo(
    () => streakBefore(activeDays(xpLogs), today),
    [xpLogs, today],
  )
  const skillId = quest?.skill?.id
  const skillLevel = useMemo(
    () =>
      skillId
        ? levelForXp(computeXp(xpLogs).bySkill[skillId] ?? 0, SKILL_LEVEL_COEFF)
        : 0,
    [xpLogs, skillId],
  )

  if (state === 'loading') {
    return <StatePanel role="status" title={t('state_loading')} />
  }

  if (!timer || !quest) {
    return (
      <StatePanel
        title={t('timer_missing_title')}
        text={t('timer_missing_text')}
        actions={
          <Button variant="primary" href={ROUTES.Today}>
            {t('nav_today')}
          </Button>
        }
      />
    )
  }

  const { activity, skill } = quest
  const realm = skill?.realm
  const elapsed = elapsedMs(timer, now)
  const minutes = loggedMinutes(elapsed)
  const running = isRunning(timer)
  const doneWithTimer = quest.done + elapsed / MINUTE_MS
  const ratio = quest.target > 0 ? doneWithTimer / quest.target : 0

  const finish = () => {
    if (minutes > 0) {
      actions.addLog({
        activity,
        value: minutes,
        source: 'timer',
        partId: timer.partId,
      })
    }
    clear()
    navigation.go(ROUTES.Today)
  }

  const discard = () => {
    clear()
    navigation.go(ROUTES.Today)
  }

  return (
    <>
      <Stack $gap="sm">
        <BackLink href={ROUTES.Today}>
          <Icon name="back" size="sm" />
          <Text variant="secondary" tone="inherit">
            {t('timer_back')}
          </Text>
        </BackLink>
        <Row $gap="md">
          <IconTile realm={realm} />
          <Stack $gap="xxs">
            <Text as="h1" variant="display" narrowVariant="hero">
              {activity.name}
            </Text>
            {skill ? (
              <Text variant="secondary" tone="muted">
                {`${skill.name} · ${t('hero_level', { level: skillLevel })}`}
              </Text>
            ) : null}
          </Stack>
        </Row>
      </Stack>

      <Columns>
        <ClockCard aria-label={activity.name}>
          <Text variant="clock">{formatClock(elapsed)}</Text>
          <Text tone="muted">
            {t('timer_of_target', {
              target: durationLabel(quest.target, t),
            })}
          </Text>
          <Wide>
            <ProgressBar
              large
              ratio={ratio}
              color={realm ? theme.realms[realm].solid : theme.colors.primary}
              label={t('timer_progress_label')}
            />
            <Row $justify="space-between">
              <Grow>
                <Text variant="secondary" tone="muted">
                  {minutes > 0 ? t('timer_note_bonus') : t('timer_too_short')}
                </Text>
              </Grow>
              <Text variant="stat">
                {t('xp_gain', {
                  xp: xpForEffort(
                    effortFor(activity, minutes),
                    'timer',
                    streak,
                  ),
                })}
              </Text>
            </Row>
          </Wide>
          <Buttons>
            <Button
              size="lg"
              icon={running ? 'pause' : 'play'}
              onClick={running ? pause : resume}>
              {t(running ? 'timer_pause' : 'timer_resume')}
            </Button>
            <Button size="lg" variant="primary" onClick={finish}>
              {t('timer_finish')}
            </Button>
            <Button size="lg" variant="ghost" onClick={discard}>
              {t('timer_discard')}
            </Button>
          </Buttons>
        </ClockCard>

        {quest.parts.length > 0 ? (
          <PartsColumn>
            <Card aria-label={t('timer_parts')}>
              <Stack $gap="sm">
                <Text as="h2" variant="title">
                  {t('timer_parts')}
                </Text>
                {quest.parts.map(part => {
                  const active = part.id === timer.partId
                  const partState = part.complete ? 'done' : 'idle'
                  return (
                    <PartRow
                      key={part.id}
                      $state={active ? 'active' : partState}
                      $realm={realm}>
                      {part.complete ? <Icon name="check" size="sm" /> : null}
                      <Grow>
                        <Text variant="bodyStrong">{part.name}</Text>
                      </Grow>
                      <Text variant="secondary" tone="muted">
                        {active
                          ? t('timer_part_now')
                          : `${formatAmount(part.done)} / ${formatAmount(part.target)} ${t('unit_min')}`}
                      </Text>
                    </PartRow>
                  )
                })}
              </Stack>
            </Card>
          </PartsColumn>
        ) : null}
      </Columns>
    </>
  )
}
