/**
 * The timer is stored as "when it last started" plus "what had accumulated
 * before that", never as a ticking counter: elapsed time is recomputed from
 * the clock, so a reload, a sleeping tab or a throttled interval cannot lose
 * or invent seconds.
 */
export type TimerState = {
  activityId: string
  partId: string
  /** Milliseconds since the epoch when it last started; null while paused. */
  startedAt: number | null
  /** Milliseconds accumulated before the last start. */
  accumulatedMs: number
}

export const startTimer = (
  activityId: string,
  partId: string,
  now: number,
): TimerState => ({ activityId, partId, startedAt: now, accumulatedMs: 0 })

export const isRunning = (timer: TimerState) => timer.startedAt !== null

export const elapsedMs = (timer: TimerState, now: number) =>
  timer.accumulatedMs +
  (timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt))

export const pauseTimer = (timer: TimerState, now: number): TimerState => ({
  ...timer,
  startedAt: null,
  accumulatedMs: elapsedMs(timer, now),
})

export const resumeTimer = (timer: TimerState, now: number): TimerState =>
  isRunning(timer) ? timer : { ...timer, startedAt: now }

const MINUTE_MS = 60_000

/**
 * Whole minutes a finished timer is logged as. Under half a minute is not
 * worth a log; from there it rounds to the nearest minute, at least one.
 */
export const loggedMinutes = (ms: number) =>
  ms < MINUTE_MS / 2 ? 0 : Math.max(1, Math.round(ms / MINUTE_MS))

/** `mm:ss`, or `h:mm:ss` past an hour. */
export const formatClock = (ms: number) => {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`
}
