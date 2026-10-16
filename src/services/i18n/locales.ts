import en from './en.json'
import uk from './uk.json'

/**
 * The language registry. A new language is a JSON file here plus one line in
 * `LOCALES`; a test keeps every file on the same keys and placeholders.
 */
export const LOCALES = {
  en: { name: 'English', strings: en },
  uk: { name: 'Українська', strings: uk },
} as const

export type Locale = keyof typeof LOCALES
export type TranslationKey = keyof typeof en

export const LOCALE_IDS = Object.keys(LOCALES) as Locale[]
export const DEFAULT_LOCALE: Locale = 'en'

/**
 * The first device language the app speaks, region ignored (`uk-UA` → `uk`),
 * so a Ukrainian phone does not open in English.
 */
export const pickLocale = (preferred: readonly string[]): Locale => {
  const match = preferred
    .map(tag => tag.toLowerCase().split('-')[0])
    .find((language): language is Locale => language in LOCALES)

  return match ?? DEFAULT_LOCALE
}
