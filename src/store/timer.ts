import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { pauseTimer, resumeTimer, startTimer, type TimerState } from '~/core'

type TimerStore = {
  /** One timer at a time. Persisted, so a reload does not lose it. */
  timer: TimerState | null
  start: (activityId: string, partId: string) => void
  pause: () => void
  resume: () => void
  clear: () => void
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      timer: null,
      start: (activityId, partId) =>
        set({ timer: startTimer(activityId, partId, Date.now()) }),
      pause: () => {
        const { timer } = get()
        if (timer) set({ timer: pauseTimer(timer, Date.now()) })
      },
      resume: () => {
        const { timer } = get()
        if (timer) set({ timer: resumeTimer(timer, Date.now()) })
      },
      clear: () => set({ timer: null }),
    }),
    { name: 'everhue-timer' },
  ),
)
