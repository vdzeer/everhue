'use client'

import { useMemo } from 'react'

import {
  Button,
  ColumnNarrow,
  ColumnWide,
  Columns,
  Icon,
  PageHeader,
  Row,
  Stack,
  StatePanel,
  Text,
} from '~/components'
import {
  addDays,
  buildGoals,
  buildHero,
  buildToday,
  nextPart,
  weekEffort,
  type Quest,
} from '~/core'
import { GoalsCard } from '~/features/goals/components'
import { HeroCard } from '~/features/hero/components'
import { useTrackingActions, useTrackingData } from '~/features/tracking/hooks'
import { useLocale, useNavigation, useToday } from '~/hooks'
import {
  DAY_LONG,
  DAY_SHORT,
  formatDay,
  formatPercent,
} from '~/services/format'
import { useT } from '~/services/i18n'
import { useDayStore, useTimerStore } from '~/store'
import { ROUTES } from '~/types'

import { DoneRow, QuestCard, WeekCard } from '../../components'

import { Chip, DateLine, Flame, Frost, TimerBanner } from './styled'

/** How many goals the side card shows before it sends you to the full list. */
const GOALS_SHOWN = 3

export const TodayScreen = () => {
  const t = useT()
  const locale = useLocale()
  const navigation = useNavigation()
  const today = useToday()
  const { state, skills, activities, logs, goals, entries, xpLogs, retry } =
    useTrackingData()
  const actions = useTrackingActions()
  const timer = useTimerStore(store => store.timer)
  const startTimer = useTimerStore(store => store.start)
  const viewedDay = useDayStore(store => store.viewedDay)
  const setViewedDay = useDayStore(store => store.setViewedDay)

  // The screen shows today unless an earlier day was picked. There is no
  // looking ahead: nothing can be logged for a day that has not come.
  const day = viewedDay && viewedDay < today ? viewedDay : today
  const isToday = day === today
  const showDay = (next: string) => setViewedDay(next < today ? next : null)

  const view = useMemo(
    () => buildToday(activities, skills, logs, day),
    [activities, skills, logs, day],
  )
  const hero = useMemo(
    () => buildHero(skills, xpLogs, today),
    [skills, xpLogs, today],
  )
  // The side cards stay on the present: "this week" is always this week.
  const week = useMemo(() => weekEffort(xpLogs, today), [xpLogs, today])
  const activeGoals = useMemo(
    () =>
      buildGoals(
        goals,
        { logs, entries, xpBySkill: hero.xp.bySkill },
        today,
      ).active.slice(0, GOALS_SHOWN),
    [goals, logs, entries, hero, today],
  )

  const dateLine = formatDay(day, locale, DAY_LONG)
  const title = () => {
    if (isToday) return t('today_title')
    if (day === addDays(today, -1)) return t('day_yesterday')
    return formatDay(day, locale, DAY_SHORT)
  }

  const timedActivity = activities.find(
    activity => activity.id === timer?.activityId,
  )

  const start = (quest: Quest) => {
    if (timer?.activityId !== quest.activity.id) {
      startTimer(quest.activity.id, nextPart(quest)?.id ?? '')
    }
    navigation.go(ROUTES.Timer)
  }

  const log = (quest: Quest, value: number) =>
    actions.addLog({
      activity: quest.activity,
      value,
      source: 'manual',
      partId: nextPart(quest)?.id ?? '',
      day,
    })

  const undo = (quest: Quest) => {
    const last = quest.logIds.at(-1)
    if (last) actions.deleteLog(last)
  }

  const xpOf = (quest: Quest) =>
    quest.logIds.reduce((sum, id) => sum + (hero.xp.byLog[id] ?? 0), 0)

  return (
    <>
      <PageHeader>
        <Stack $gap="xxs">
          <DateLine>
            <Text variant="secondary" tone="muted">
              {dateLine}
            </Text>
          </DateLine>
          <Row $gap="xs">
            <Text as="h1" variant="display" narrowVariant="hero">
              {title()}
            </Text>
            <Row $gap="xxs" $nowrap>
              <Button
                variant="ghost"
                icon="chevronLeft"
                aria-label={t('day_prev')}
                onClick={() => showDay(addDays(day, -1))}
              />
              <Button
                variant="ghost"
                icon="chevron"
                aria-label={t('day_next')}
                disabled={isToday}
                onClick={() => showDay(addDays(day, 1))}
              />
            </Row>
            {isToday ? null : (
              <Button onClick={() => setViewedDay(null)}>
                {t('day_back_to_today')}
              </Button>
            )}
          </Row>
        </Stack>
        <Row>
          <Chip>
            <Flame>
              <Icon name="flame" />
            </Flame>
            <Text variant="stat">{hero.streak}</Text>
            <Text variant="secondary" tone="muted">
              {t('streak_label')}
            </Text>
          </Chip>
          <Chip aria-label={t('freeze_chip', { count: hero.freezes })}>
            <Frost>
              <Icon name="snow" />
            </Frost>
            <Text variant="stat">{hero.freezes}</Text>
            <Text variant="secondary" tone="muted">
              {t('freeze_label')}
            </Text>
          </Chip>
          <Chip>
            <Text variant="stat">{formatPercent(hero.consistency)}</Text>
            <Text variant="secondary" tone="muted">
              {t('consistency_label')}
            </Text>
          </Chip>
          <Button icon="history" href={ROUTES.History}>
            {t('today_history')}
          </Button>
        </Row>
      </PageHeader>

      {isToday ? null : <Text tone="muted">{t('day_past_note')}</Text>}
      {isToday && hero.frozenYesterday ? (
        <Text tone="muted">{t('freeze_used_yesterday')}</Text>
      ) : null}

      {timer && timedActivity ? (
        <TimerBanner>
          <Text variant="bodyStrong" tone="inherit">
            {t('today_timer_running', { name: timedActivity.name })}
          </Text>
          <Button href={ROUTES.Timer}>{t('today_timer_open')}</Button>
        </TimerBanner>
      ) : null}

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
        <Columns>
          <ColumnWide>
            {view.total === 0 ? (
              <StatePanel
                title={t('today_empty_title')}
                text={t('today_empty_text')}
                actions={
                  <Button variant="primary" href={ROUTES.Plan}>
                    {t('today_empty_action')}
                  </Button>
                }
              />
            ) : (
              <Stack
                as="section"
                $gap="sm"
                aria-label={t(isToday ? 'today_quests' : 'day_quests')}>
                <Row $justify="space-between" $align="baseline">
                  <Text as="h2" variant="title">
                    {t(isToday ? 'today_quests' : 'day_quests')}
                  </Text>
                  <Text variant="secondary" tone="muted">
                    {t('today_done_count', {
                      done: view.done.length,
                      total: view.total,
                    })}
                  </Text>
                </Row>
                {view.pending.length === 0 ? (
                  <Text tone="muted">
                    {t(isToday ? 'today_all_done' : 'day_all_done')}
                  </Text>
                ) : null}
                {view.pending.map((quest, index) => (
                  <QuestCard
                    key={quest.activity.id}
                    quest={quest}
                    primary={index === 0}
                    timerBusy={
                      timer !== null && timer.activityId !== quest.activity.id
                    }
                    timerAllowed={isToday}
                    onStart={start}
                    onLog={log}
                  />
                ))}
              </Stack>
            )}

            {view.done.length > 0 ? (
              <Stack
                as="section"
                $gap="xs"
                aria-label={t('today_done_section')}>
                <Text as="h2" variant="label" tone="muted">
                  {t('today_done_section')}
                </Text>
                {view.done.map(quest => (
                  <DoneRow
                    key={quest.activity.id}
                    quest={quest}
                    xp={xpOf(quest)}
                    onUndo={undo}
                  />
                ))}
              </Stack>
            ) : null}
          </ColumnWide>

          <ColumnNarrow>
            <HeroCard hero={hero} />
            {activeGoals.length > 0 ? (
              <GoalsCard
                items={activeGoals}
                context={{ activities, skills, locale, t }}
              />
            ) : null}
            <WeekCard week={week} reviewHref={ROUTES.Week} />
          </ColumnNarrow>
        </Columns>
      ) : null}
    </>
  )
}
