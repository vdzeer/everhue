import { useEffect, useSyncExternalStore } from 'react'

import {
  DEFAULT_LOCALE,
  changeLocale,
  pickLocale,
  type Locale,
} from '~/services/i18n'
import { useSettingsStore } from '~/store'

const subscribe = (onChange: () => void) => {
  window.addEventListener('languagechange', onChange)
  return () => window.removeEventListener('languagechange', onChange)
}

const deviceLocale = () =>
  pickLocale(
    navigator.languages?.length ? navigator.languages : [navigator.language],
  )

/** The user's choice if they made one, otherwise the device language. */
export const useLocale = (): Locale => {
  const stored = useSettingsStore(state => state.locale)
  const device = useSyncExternalStore(
    subscribe,
    deviceLocale,
    () => DEFAULT_LOCALE,
  )

  return stored ?? device
}

/** Keeps i18next and the document language on the resolved locale. */
export const useLocaleSync = () => {
  const locale = useLocale()

  useEffect(() => {
    changeLocale(locale)
    document.documentElement.lang = locale
  }, [locale])

  return locale
}
