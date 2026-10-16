import { create } from 'zustand'

import type { DayKey } from '~/core'

type DayState = {
  /**
   * The day the Today screen is showing. Null means "today", so an open tab
   * follows midnight by itself. Not persisted: a reload returns to today.
   */
  viewedDay: DayKey | null
  setViewedDay: (day: DayKey | null) => void
}

export const useDayStore = create<DayState>(set => ({
  viewedDay: null,
  setViewedDay: viewedDay => set({ viewedDay }),
}))
