'use client'

import { useMemo, useState } from 'react'
import { useTheme } from 'styled-components'

import {
  Button,
  Card,
  ColumnNarrow,
  ColumnWide,
  Columns,
  Grow,
  IconTile,
  PageHeader,
  ProgressBar,
  Row,
  Stack,
  StatePanel,
  Text,
} from '~/components'
import { addDays, buildWeekReview, type DayKey } from '~/core'
import { WeekCard } from '~/features/today/components'
import { useTrackingData } from '~/features/tracking/hooks'
import { durationLabel } from '~/features/tracking/services'
import { useLocale, useToday } from '~/hooks'
import { DAY_SHORT, formatDay, formatPercent } from '~/services/format'
import { useT } from '~/services/i18n'
import { ROUTES } from '~/types'

import { Item, RangeLine, Rows, Stat, Stats } from './styled'

const WEEKDAY = { weekday: 'long' } as const

export const ReviewScreen = () => {
  const t = useT()
  const theme = useTheme()
  const locale = useLocale()
  const today = useToday()
  const { state, skills, activities, logs, xpLogs, retry } = useTrackingData()
  // Null is the current week, so an open tab follows the calendar.
  const [picked, setPicked] = useState<DayKey | null>(null)

  const review = useMemo(
    () =>
      buildWeekReview(activities, skills, logs, xpLogs, today, picked ?? today),
    [activities, skills, logs, xpLogs, today, picked],
  )

  const showWeek = (day: DayKey) => setPicked(day < today ? day : null)
  const difference = review.minutes - review.previousMinutes

  const comparison = () => {
    if (review.minutes === 0 && review.previousMinutes === 0) return null
    if (difference === 0) return t('review_same')
    return t(difference > 0 ? 'review_more' : 'review_less', {
      amount: durationLabel(Math.abs(difference), t),
    })
  }

  const empty = review.minutes === 0 && review.xp === 0

  return (
    <>
      <Row>
        <Button variant="ghost" icon="back" href={ROUTES.Today}>
          {t('timer_back')}
        </Button>
      </Row>
      <PageHeader>
        <Stack $gap="xxs">
          <RangeLine>
            <Text variant="secondary" tone="muted">
              {`${formatDay(review.start, locale, DAY_SHORT)} – ${formatDay(
                review.end,
                locale,
                DAY_SHORT,
              )}`}
            </Text>
          </RangeLine>
          <Row $gap="xs">
            <Text as="h1" variant="display" narrowVariant="hero">
              {t('review_title')}
            </Text>
            <Row $gap="xxs" $nowrap>
              <Button
                variant="ghost"
                icon="chevronLeft"
                aria-label={t('review_prev')}
                onClick={() => showWeek(addDays(review.start, -7))}
              />
              <Button
                variant="ghost"
                icon="chevron"
                aria-label={t('review_next')}
                disabled={review.current}
                onClick={() => showWeek(addDays(review.start, 7))}
              />
            </Row>
            {review.current ? null : (
              <Button onClick={() => setPicked(null)}>{t('week_title')}</Button>
            )}
          </Row>
        </Stack>
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

      {state === 'ready' && empty ? (
        <StatePanel
          title={t('review_empty_title')}
          text={t('review_empty_text')}
          actions={
            <Button variant="primary" href={ROUTES.Today}>
              {t('history_open_today')}
            </Button>
          }
        />
      ) : null}

      {state === 'ready' && !empty ? (
        <Columns>
          <ColumnWide>
            <Card aria-label={t('review_title')}>
              <Stack>
                <Stats>
                  <Stat>
                    <Text variant="stat">
                      {durationLabel(review.minutes, t)}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {t('review_time')}
                    </Text>
                  </Stat>
                  <Stat>
                    <Text variant="stat">{review.xp}</Text>
                    <Text variant="caption" tone="muted">
                      {t('review_xp')}
                    </Text>
                  </Stat>
                  <Stat>
                    <Text variant="stat">
                      {t('review_days_value', {
                        done: review.activeDays,
                        total: review.daysSoFar,
                      })}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {t('review_days')}
                    </Text>
                  </Stat>
                </Stats>
                {comparison() ? (
                  <Text variant="secondary" tone="muted">
                    {comparison()}
                  </Text>
                ) : null}
                {review.bestDay ? (
                  <Text variant="secondary" tone="muted">
                    {t('review_best_day', {
                      day: formatDay(review.bestDay.day, locale, WEEKDAY),
                      amount: durationLabel(review.bestDay.minutes, t),
                    })}
                  </Text>
                ) : null}
              </Stack>
            </Card>

            <Card aria-label={t('review_behind')}>
              <Stack>
                <Text as="h2" variant="title">
                  {t('review_behind')}
                </Text>
                {review.behind.length === 0 ? (
                  <Text tone="muted">{t('review_nothing_behind')}</Text>
                ) : (
                  <Rows>
                    {review.behind.map(
                      ({ activity, skill, due, done, ratio }) => (
                        <Item key={activity.id}>
                          <IconTile
                            realm={skill?.realm}
                            active={done > 0}
                            small
                          />
                          <Grow>
                            <Stack $gap="xxs">
                              <Row
                                $justify="space-between"
                                $align="baseline"
                                $gap="xs">
                                <Text variant="bodyStrong">
                                  {activity.name}
                                </Text>
                                <Text variant="secondary" tone="muted">
                                  {t('review_done_of', { done, due })}
                                </Text>
                              </Row>
                              <ProgressBar
                                ratio={ratio}
                                color={
                                  skill
                                    ? theme.realms[skill.realm].solid
                                    : theme.colors.onSurfaceMuted
                                }
                                label={`${activity.name}: ${t(
                                  'progress_label',
                                  {
                                    percent: formatPercent(ratio),
                                  },
                                )}`}
                              />
                            </Stack>
                          </Grow>
                        </Item>
                      ),
                    )}
                  </Rows>
                )}
              </Stack>
            </Card>

            {review.onTrack.length > 0 ? (
              <Card aria-label={t('review_on_track')}>
                <Stack>
                  <Text as="h2" variant="title">
                    {t('review_on_track')}
                  </Text>
                  <Rows>
                    {review.onTrack.map(({ activity, skill, due, done }) => (
                      <Item key={activity.id}>
                        <IconTile realm={skill?.realm} small />
                        <Grow>
                          <Text variant="bodyStrong">{activity.name}</Text>
                        </Grow>
                        <Text variant="secondary" tone="muted">
                          {t('review_done_of', { done, due })}
                        </Text>
                      </Item>
                    ))}
                  </Rows>
                </Stack>
              </Card>
            ) : null}
          </ColumnWide>

          <ColumnNarrow>
            <WeekCard
              title={t('review_by_day')}
              week={review.days.map(day => ({
                day: day.day,
                minutes: day.minutes,
                isToday: day.day === today,
              }))}
            />

            {review.skills.length > 0 ? (
              <Card aria-label={t('review_skills')}>
                <Stack>
                  <Text as="h2" variant="subtitle">
                    {t('review_skills')}
                  </Text>
                  <Rows>
                    {review.skills.map(
                      ({ skill, xp, levelBefore, levelAfter }) => (
                        <Item key={skill.id}>
                          <IconTile realm={skill.realm} small />
                          <Grow>
                            <Stack $gap="xxs">
                              <Text variant="bodyStrong">{skill.name}</Text>
                              {levelAfter > levelBefore ? (
                                <Text variant="caption" tone="muted">
                                  {t('review_level_up', {
                                    from: levelBefore,
                                    to: levelAfter,
                                  })}
                                </Text>
                              ) : null}
                            </Stack>
                          </Grow>
                          <Text variant="label">{t('xp_gain', { xp })}</Text>
                        </Item>
                      ),
                    )}
                  </Rows>
                </Stack>
              </Card>
            ) : null}
          </ColumnNarrow>
        </Columns>
      ) : null}
    </>
  )
}
