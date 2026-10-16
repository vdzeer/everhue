import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Locale } from '~/services/i18n'
import { SETTINGS_STORAGE_KEY, type ThemePreference } from '~/types'

type SettingsState = {
  /** Null until the user picks one: the device language decides. */
  locale: Locale | null
  setLocale: (locale: Locale) => void
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      locale: null,
      setLocale: locale => set({ locale }),
      theme: 'system',
      setTheme: theme => set({ theme }),
    }),
    { name: SETTINGS_STORAGE_KEY },
  ),
)
