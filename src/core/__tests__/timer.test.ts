import {
  elapsedMs,
  formatClock,
  isRunning,
  loggedMinutes,
  pauseTimer,
  resumeTimer,
  startTimer,
} from '../timer'

const T0 = 1_760_000_000_000

describe('timer state', () => {
  it('measures from the clock, not from ticks', () => {
    const timer = startTimer('english', 'anki', T0)

    expect(isRunning(timer)).toBe(true)
    expect(elapsedMs(timer, T0 + 272_000)).toBe(272_000)
  })

  it('keeps what accumulated across a pause', () => {
    const paused = pauseTimer(startTimer('english', '', T0), T0 + 60_000)

    expect(isRunning(paused)).toBe(false)
    // An hour passes while paused.
    expect(elapsedMs(paused, T0 + 3_660_000)).toBe(60_000)

    const resumed = resumeTimer(paused, T0 + 3_660_000)
    expect(elapsedMs(resumed, T0 + 3_690_000)).toBe(90_000)
  })

  it('ignores a second resume and a clock that went backwards', () => {
    const timer = startTimer('english', '', T0)

    expect(resumeTimer(timer, T0 + 5_000)).toBe(timer)
    expect(elapsedMs(timer, T0 - 5_000)).toBe(0)
  })
})

describe('loggedMinutes', () => {
  it.each([
    [0, 0],
    [29_000, 0],
    [30_000, 1],
    [89_000, 1],
    [90_000, 2],
    [272_000, 5],
    [600_000, 10],
  ])('%i ms is logged as %i min', (ms, minutes) => {
    expect(loggedMinutes(ms)).toBe(minutes)
  })
})

describe('formatClock', () => {
  it.each([
    [0, '00:00'],
    [272_000, '04:32'],
    [3_599_000, '59:59'],
    [3_600_000, '1:00:00'],
    [-5, '00:00'],
  ])('%i ms shows as %s', (ms, text) => {
    expect(formatClock(ms)).toBe(text)
  })
})
