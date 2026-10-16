'use client'

import { useState } from 'react'

import {
  Button,
  Card,
  Grow,
  NarrowOnly,
  Row,
  Segmented,
  Stack,
  Text,
} from '~/components'
import { buildHero } from '~/core'
import { useTrackingData } from '~/features/tracking/hooks'
import { useLocale, useToday } from '~/hooks'
import { signOutUser } from '~/services/firebase'
import {
  LOCALES,
  LOCALE_IDS,
  changeLocale,
  useT,
  type Locale,
  type TranslationKey,
} from '~/services/i18n'
import { useAuthStore, useSettingsStore, useTimerStore } from '~/store'
import { ROUTES, THEME_PREFERENCES, type ThemePreference } from '~/types'

import {
  buildExport,
  deleteAccount,
  exportFileName,
  logsCsv,
  saveTextFile,
} from '../../services'

import { Divider } from './styled'

const LANGUAGE_OPTIONS = LOCALE_IDS.map(id => ({
  value: id,
  label: LOCALES[id].name,
}))

const THEME_LABEL: Record<ThemePreference, TranslationKey> = {
  system: 'theme_system',
  light: 'theme_light',
  dark: 'theme_dark',
}

type DeleteState = 'idle' | 'deleting' | 'failed'

export const SettingsScreen = () => {
  const t = useT()
  const locale = useLocale()
  const email = useAuthStore(state => state.user?.email)
  const setLocale = useSettingsStore(state => state.setLocale)
  const theme = useSettingsStore(state => state.theme)
  const setTheme = useSettingsStore(state => state.setTheme)
  const today = useToday()
  const data = useTrackingData()
  const clearTimer = useTimerStore(state => state.clear)
  const [deleteState, setDeleteState] = useState<DeleteState>('idle')
  const [leaving, setLeaving] = useState(false)

  const pickLanguage = (next: Locale) => {
    setLocale(next)
    changeLocale(next)
  }

  const exportJson = () =>
    saveTextFile(
      exportFileName(today, 'json'),
      'application/json',
      JSON.stringify(buildExport(data, new Date()), null, 2),
    )

  const exportCsv = () =>
    saveTextFile(
      exportFileName(today, 'csv'),
      'text/csv',
      logsCsv(data, buildHero(data.skills, data.xpLogs, today).xp.byLog),
    )

  // The auth listener clears the cache and reloads once this resolves.
  const leave = async () => {
    setLeaving(true)
    clearTimer()
    try {
      await signOutUser()
    } catch (error) {
      console.error(error)
      setLeaving(false)
    }
  }

  const removeAccount = async () => {
    if (!window.confirm(t('settings_delete_text'))) return
    setDeleteState('deleting')
    try {
      await deleteAccount()
      clearTimer()
    } catch (error) {
      console.error(error)
      setDeleteState('failed')
    }
  }

  return (
    <>
      <NarrowOnly>
        <Button variant="ghost" icon="back" href={ROUTES.Hero}>
          {t('settings_back')}
        </Button>
      </NarrowOnly>
      <Text as="h1" variant="display" narrowVariant="hero">
        {t('settings_title')}
      </Text>

      <Card aria-label={t('settings_language')}>
        <Stack>
          <Text as="h2" variant="title">
            {t('settings_language')}
          </Text>
          <Segmented
            label={t('settings_language')}
            options={LANGUAGE_OPTIONS}
            selected={[locale]}
            onSelect={pickLanguage}
          />
        </Stack>
      </Card>

      <Card aria-label={t('settings_theme')}>
        <Stack>
          <Text as="h2" variant="title">
            {t('settings_theme')}
          </Text>
          <Segmented
            label={t('settings_theme')}
            options={THEME_PREFERENCES.map(option => ({
              value: option,
              label: t(THEME_LABEL[option]),
            }))}
            selected={[theme]}
            onSelect={setTheme}
          />
        </Stack>
      </Card>

      <Card aria-label={t('settings_data')}>
        <Stack>
          <Text as="h2" variant="title">
            {t('settings_data')}
          </Text>
          <Text variant="secondary" tone="muted">
            {t(
              data.state === 'ready'
                ? 'settings_export_text'
                : 'settings_export_wait',
            )}
          </Text>
          <Row>
            <Button
              icon="download"
              disabled={data.state !== 'ready'}
              onClick={exportJson}>
              {t('settings_export_json')}
            </Button>
            <Button
              icon="download"
              disabled={data.state !== 'ready'}
              onClick={exportCsv}>
              {t('settings_export_csv')}
            </Button>
          </Row>
        </Stack>
      </Card>

      <Card aria-label={t('settings_account')}>
        <Stack>
          <Text as="h2" variant="title">
            {t('settings_account')}
          </Text>
          <Row $justify="space-between">
            <Grow>
              <Stack $gap="xxs">
                {email ? <Text variant="bodyStrong">{email}</Text> : null}
                <Text variant="secondary" tone="muted">
                  {t('settings_signed_in_with')}
                </Text>
              </Stack>
            </Grow>
            <Button disabled={leaving} onClick={leave}>
              {t('settings_sign_out')}
            </Button>
          </Row>
          <Divider>
            <Row $justify="space-between">
              <Grow>
                <Text variant="secondary" tone="muted">
                  {t('settings_delete_text')}
                </Text>
              </Grow>
              <Button
                variant="danger"
                disabled={deleteState === 'deleting'}
                onClick={removeAccount}>
                {t(
                  deleteState === 'deleting'
                    ? 'settings_deleting'
                    : 'settings_delete',
                )}
              </Button>
            </Row>
          </Divider>
          {deleteState === 'failed' ? (
            <Text variant="secondary" tone="danger">
              {t('settings_delete_failed')}
            </Text>
          ) : null}
        </Stack>
      </Card>
    </>
  )
}
