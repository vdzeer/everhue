import { contributionLogs, goalLogId } from '../goals'
import { buildHistory } from '../history'
import { computeXp } from '../xp'

import { makeEntry, makeGoal, makeLog } from './fixtures'

describe('buildHistory', () => {
  it('lists days newest first and a day in the order it happened', () => {
    const logs = [
      makeLog({ id: 'late', day: '2026-10-12', createdAt: 20 }),
      makeLog({ id: 'old', day: '2026-10-10', createdAt: 5 }),
      makeLog({ id: 'early', day: '2026-10-12', createdAt: 10 }),
    ]
    const history = buildHistory(logs, [], {})

    expect(history.map(day => day.day)).toEqual(['2026-10-12', '2026-10-10'])
    expect(history[0].logs.map(item => item.log.id)).toEqual(['early', 'late'])
  })

  it('totals the minutes and the XP of a day', () => {
    const logs = [
      makeLog({ id: 'a', effortMinutes: 10 }),
      makeLog({ id: 'b', effortMinutes: 25 }),
    ]
    const [day] = buildHistory(logs, [], computeXp(logs).byLog)

    expect(day.minutes).toBe(35)
    expect(day.xp).toBe(35)
    expect(day.logs.map(item => item.xp)).toEqual([10, 25])
  })

  it('has a day for a contribution even when nothing else was logged', () => {
    const entries = [makeEntry({ day: '2026-10-07' })]

    expect(buildHistory([], entries, {})).toEqual([
      expect.objectContaining({ day: '2026-10-07', minutes: 0, logs: [] }),
    ])
  })

  it('shows the XP of a contribution once, on the first payment of the day', () => {
    const goal = makeGoal({ id: 'laptop', skillId: 'finance' })
    const entries = [
      makeEntry({ id: 'first', goalId: 'laptop', amount: 500, createdAt: 1 }),
      makeEntry({ id: 'second', goalId: 'laptop', amount: 500, createdAt: 2 }),
      makeEntry({ id: 'out', goalId: 'laptop', amount: -100, createdAt: 3 }),
    ]
    const xp = computeXp(contributionLogs([goal], entries)).byLog
    const [day] = buildHistory([], entries, xp)

    expect(day.entries.map(item => item.xp)).toEqual([
      xp[goalLogId('laptop', '2026-10-12')],
      0,
      0,
    ])
    expect(day.xp).toBe(xp[goalLogId('laptop', '2026-10-12')])
  })

  it('does not credit a withdrawal that comes before the payment', () => {
    const goal = makeGoal({ id: 'laptop', skillId: 'finance' })
    const entries = [
      makeEntry({ id: 'out', goalId: 'laptop', amount: -100, createdAt: 1 }),
      makeEntry({ id: 'in', goalId: 'laptop', amount: 500, createdAt: 2 }),
    ]
    const xp = computeXp(contributionLogs([goal], entries)).byLog
    const [day] = buildHistory([], entries, xp)

    expect(day.entries.map(item => item.xp > 0)).toEqual([false, true])
  })
})
