'use client'

import { useMemo, useState } from 'react'

import { Button, PageHeader, Row, Stack, StatePanel, Text } from '~/components'
import { buildHero, buildHistory } from '~/core'
import { useTrackingActions, useTrackingData } from '~/features/tracking/hooks'
import { useLocale, useNavigation, useToday } from '~/hooks'
import { useT } from '~/services/i18n'
import { useDayStore } from '~/store'
import { ROUTES } from '~/types'

import { DayCard } from '../../components'

/** Days shown at first, and added by each "show earlier". */
const PAGE_DAYS = 14

export const HistoryScreen = () => {
  const t = useT()
  const locale = useLocale()
  const navigation = useNavigation()
  const today = useToday()
  const { state, skills, activities, logs, goals, entries, xpLogs, retry } =
    useTrackingData()
  const actions = useTrackingActions()
  const setViewedDay = useDayStore(store => store.setViewedDay)
  const [shown, setShown] = useState(PAGE_DAYS)

  const history = useMemo(
    () =>
      buildHistory(logs, entries, buildHero(skills, xpLogs, today).xp.byLog),
    [logs, entries, skills, xpLogs, today],
  )

  const openDay = (day: string) => {
    setViewedDay(day < today ? day : null)
    navigation.go(ROUTES.Today)
  }

  const deleteLog = (logId: string) => {
    if (window.confirm(t('confirm_delete_log'))) actions.deleteLog(logId)
  }

  const deleteEntry = (entryId: string) => {
    if (window.confirm(t('confirm_delete_log'))) actions.deleteEntry(entryId)
  }

  return (
    <>
      <Row>
        <Button variant="ghost" icon="back" href={ROUTES.Today}>
          {t('timer_back')}
        </Button>
      </Row>
      <PageHeader>
        <Stack $gap="xxs">
          <Text as="h1" variant="display" narrowVariant="hero">
            {t('history_title')}
          </Text>
          <Text tone="muted">{t('history_subtitle')}</Text>
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

      {state === 'ready' && history.length === 0 ? (
        <StatePanel
          title={t('history_empty_title')}
          text={t('history_empty_text')}
          actions={
            <Button variant="primary" href={ROUTES.Today}>
              {t('history_open_today')}
            </Button>
          }
        />
      ) : null}

      {state === 'ready'
        ? history
            .slice(0, shown)
            .map(day => (
              <DayCard
                key={day.day}
                day={day}
                activities={activities}
                skills={skills}
                goals={goals}
                locale={locale}
                t={t}
                onOpen={openDay}
                onDeleteLog={deleteLog}
                onDeleteEntry={deleteEntry}
              />
            ))
        : null}

      {state === 'ready' && history.length > shown ? (
        <Row $justify="center">
          <Button onClick={() => setShown(shown + PAGE_DAYS)}>
            {t('history_more')}
          </Button>
        </Row>
      ) : null}
    </>
  )
}
