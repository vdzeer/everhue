import i18next from 'i18next'
import { useCallback } from 'react'
import { initReactI18next, useTranslation } from 'react-i18next'

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_IDS,
  type Locale,
  type TranslationKey,
} from './locales'

// Initialised once, synchronously, with every language bundled: there is no
// loading state and no flash of keys.
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: Object.fromEntries(
      LOCALE_IDS.map(id => [id, { translation: LOCALES[id].strings }]),
    ),
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  })
}

export const changeLocale = (locale: Locale) => {
  if (i18next.language !== locale) i18next.changeLanguage(locale)
}

type Values = Record<string, string | number>

/** `t` with keys checked against the English file. */
export const useT = () => {
  const { t } = useTranslation()

  return useCallback(
    (key: TranslationKey, values?: Values): string => t(key, values ?? {}),
    [t],
  )
}

export type Translate = ReturnType<typeof useT>

export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_IDS,
  pickLocale,
  type Locale,
  type TranslationKey,
} from './locales'
