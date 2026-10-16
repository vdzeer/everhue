import { Button, Card, Grow, IconTile, Row, Stack, Text } from '~/components'
import type {
  Activity,
  Goal,
  HistoryDay,
  HistoryEntry,
  HistoryLog,
  Skill,
} from '~/core'
import { durationLabel } from '~/features/tracking/services'
import {
  DAY_LONG,
  formatAmount,
  formatDay,
  formatMoney,
} from '~/services/format'
import type { Locale, Translate } from '~/services/i18n'

import { DayName, EntryRow, Figures, Head, Rows } from './styled'

type Props = {
  day: HistoryDay
  activities: Activity[]
  skills: Skill[]
  goals: Goal[]
  locale: Locale
  t: Translate
  onOpen: (day: string) => void
  onDeleteLog: (logId: string) => void
  onDeleteEntry: (entryId: string) => void
}

export const DayCard = ({
  day,
  activities,
  skills,
  goals,
  locale,
  t,
  onOpen,
  onDeleteLog,
  onDeleteEntry,
}: Props) => {
  const realmOf = (skillId: string | undefined) =>
    skills.find(skill => skill.id === skillId)?.realm

  const logRow = ({ log, xp }: HistoryLog) => {
    // The activity may have been deleted since; its logs stay.
    const activity = activities.find(item => item.id === log.activityId)
    const name = activity?.name ?? t('history_deleted_activity')
    const part = activity?.parts.find(item => item.id === log.partId)?.name

    const amount = () => {
      if (log.kind === 'time') return durationLabel(log.value, t)
      if (log.kind === 'check') return t('history_check')
      return `${formatAmount(log.value)} ${activity?.unit ?? ''}`.trim()
    }

    return (
      <EntryRow key={log.id}>
        <IconTile realm={realmOf(log.skillId)} small />
        <Grow>
          <Stack $gap="xxs">
            <Text variant="bodyStrong">{name}</Text>
            <Text variant="caption" tone="muted">
              {[
                part,
                t(
                  log.source === 'timer'
                    ? 'history_source_timer'
                    : 'history_source_manual',
                ),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </Stack>
        </Grow>
        <Figures>
          <Text variant="secondary">{amount()}</Text>
          <Text variant="caption" tone="muted">
            {t('xp_gain', { xp })}
          </Text>
        </Figures>
        <Button
          variant="ghost"
          icon="trash"
          aria-label={`${t('history_delete')}: ${name}`}
          onClick={() => onDeleteLog(log.id)}
        />
      </EntryRow>
    )
  }

  const entryRow = ({ entry, xp }: HistoryEntry) => {
    const goal = goals.find(item => item.id === entry.goalId)
    const name = goal?.name ?? t('history_deleted_goal')
    const sum = Math.abs(entry.amount)
    const money = goal?.currency
      ? formatMoney(sum, goal.currency, locale)
      : formatAmount(sum)

    return (
      <EntryRow key={entry.id}>
        <IconTile realm={realmOf(goal?.skillId)} icon="coin" small />
        <Grow>
          <Stack $gap="xxs">
            <Text variant="bodyStrong">{name}</Text>
            <Text variant="caption" tone="muted">
              {t(
                entry.amount > 0
                  ? 'history_contribution'
                  : 'history_withdrawal',
              )}
            </Text>
          </Stack>
        </Grow>
        <Figures>
          <Text variant="secondary">
            {`${entry.amount > 0 ? '+' : '−'}${money}`}
          </Text>
          {xp > 0 ? (
            <Text variant="caption" tone="muted">
              {t('xp_gain', { xp })}
            </Text>
          ) : null}
        </Figures>
        <Button
          variant="ghost"
          icon="trash"
          aria-label={`${t('history_delete')}: ${name}`}
          onClick={() => onDeleteEntry(entry.id)}
        />
      </EntryRow>
    )
  }

  const title = formatDay(day.day, locale, DAY_LONG)

  return (
    <Card aria-label={title}>
      <Stack $gap="sm">
        <Head>
          <DayName>
            <Text as="h2" variant="subtitle">
              {title}
            </Text>
          </DayName>
          <Row $gap="sm">
            <Text variant="secondary" tone="muted">
              {[
                day.minutes > 0 ? durationLabel(day.minutes, t) : '',
                t('xp_gain', { xp: day.xp }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Button onClick={() => onOpen(day.day)}>
              {t('history_open_day')}
            </Button>
          </Row>
        </Head>
        <Rows>
          {day.logs.map(logRow)}
          {day.entries.map(entryRow)}
        </Rows>
      </Stack>
    </Card>
  )
}
