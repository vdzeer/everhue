import { xpForLevel, SKILL_LEVEL_COEFF } from '../levels'
import { buildWeekReview } from '../review'

import { makeActivity, makeLog, makeSkill } from './fixtures'

// 2026-10-05 is a Monday; the week runs to Sunday the 11th.
const MONDAY = '2026-10-05'
const WEDNESDAY = '2026-10-07'
const SUNDAY = '2026-10-11'
const NEXT_WEEK = '2026-10-14'
/** Before the week began, so an activity is expected on every day of it. */
const LONG_AGO = new Date(2026, 8, 1).getTime()

const english = makeSkill({ id: 'languages', createdAt: 1 })
const strength = makeSkill({ id: 'strength', realm: 'forge', createdAt: 2 })
const daily = makeActivity({
  id: 'english',
  skillId: 'languages',
  target: 10,
  createdAt: LONG_AGO,
})

const log = (day: string, overrides = {}) =>
  makeLog({ activityId: 'english', skillId: 'languages', day, ...overrides })

const review = (
  logs: ReturnType<typeof makeLog>[],
  today: string,
  activities = [daily],
  week = MONDAY,
) => buildWeekReview(activities, [english, strength], logs, logs, today, week)

describe('the week itself', () => {
  it('runs Monday to Sunday whichever of its days is asked for', () => {
    expect(review([], NEXT_WEEK, [daily], WEDNESDAY)).toMatchObject({
      start: MONDAY,
      end: SUNDAY,
      current: false,
    })
  })

  it('counts only the days that have come in a week still running', () => {
    const result = review([], WEDNESDAY)

    expect(result.current).toBe(true)
    expect(result.daysSoFar).toBe(3)
    expect(result.days.map(day => day.future)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ])
  })
})

describe('totals', () => {
  const logs = [
    log(MONDAY, { effortMinutes: 10 }),
    log(WEDNESDAY, { effortMinutes: 30 }),
    log(WEDNESDAY, { effortMinutes: 15 }),
    log('2026-09-30', { effortMinutes: 20 }),
    log('2026-10-12', { effortMinutes: 99 }),
  ]

  it('adds up the minutes and the active days of the week only', () => {
    expect(review(logs, NEXT_WEEK)).toMatchObject({
      minutes: 55,
      activeDays: 2,
      daysSoFar: 7,
    })
  })

  it('names the best day', () => {
    expect(review(logs, NEXT_WEEK).bestDay).toMatchObject({
      day: WEDNESDAY,
      minutes: 45,
    })
  })

  it('has no best day in an empty week', () => {
    expect(review([], NEXT_WEEK).bestDay).toBeNull()
  })

  it('brings the week before along for comparison', () => {
    expect(review(logs, NEXT_WEEK).previousMinutes).toBe(20)
  })

  it('counts the XP earned in the week', () => {
    // 10 on Monday. Tuesday is empty, but the week's freeze covers it, so
    // Wednesday still builds on one day: 30 and 15, each with 5% on top.
    expect(review(logs, NEXT_WEEK).xp).toBe(10 + 32 + 16)
  })
})

describe('skills', () => {
  it('lists only skills that earned XP, the biggest gain first', () => {
    const logs = [
      log(MONDAY, { effortMinutes: 10 }),
      makeLog({ skillId: 'strength', day: MONDAY, effortMinutes: 45 }),
    ]

    expect(
      review(logs, NEXT_WEEK).skills.map(item => [item.skill.id, item.xp]),
    ).toEqual([
      ['strength', 45],
      ['languages', 10],
    ])
  })

  it('shows the level before the week and after it', () => {
    const toLevelTwo = xpForLevel(2, SKILL_LEVEL_COEFF)
    const logs = [
      log('2026-09-20', { effortMinutes: 12 }),
      log(MONDAY, { effortMinutes: toLevelTwo }),
    ]

    expect(review(logs, NEXT_WEEK).skills[0]).toMatchObject({
      levelBefore: 1,
      levelAfter: 2,
    })
  })
})

describe('activities', () => {
  it('is behind when a daily activity missed days', () => {
    const logs = [log(MONDAY, { value: 10 }), log(WEDNESDAY, { value: 10 })]
    const result = review(logs, NEXT_WEEK)

    expect(result.behind).toEqual([
      expect.objectContaining({ due: 7, done: 2, ratio: 2 / 7 }),
    ])
    expect(result.onTrack).toEqual([])
  })

  it('does not count a day where the target was only half done', () => {
    const logs = [log(MONDAY, { value: 5 })]

    expect(review(logs, NEXT_WEEK).behind[0].done).toBe(0)
  })

  it('is on track when it was done every day the week asked', () => {
    const logs = [MONDAY, '2026-10-06', WEDNESDAY].map(day =>
      log(day, { value: 10 }),
    )
    const result = review(logs, WEDNESDAY)

    expect(result.onTrack).toEqual([
      expect.objectContaining({ due: 3, done: 3, ratio: 1 }),
    ])
    expect(result.behind).toEqual([])
  })

  it('asks a weekday activity only on its days', () => {
    const weekdays = makeActivity({
      id: 'english',
      skillId: 'languages',
      createdAt: LONG_AGO,
      schedule: { type: 'weekdays', days: [1, 3, 5] },
    })
    const logs = [log(MONDAY, { value: 10 }), log('2026-10-06', { value: 10 })]

    // Tuesday is not one of its days, so it does not make up for Wednesday.
    expect(review(logs, NEXT_WEEK, [weekdays]).behind[0]).toMatchObject({
      due: 3,
      done: 1,
    })
  })

  it('spreads an "N times a week" activity over the week', () => {
    const thrice = makeActivity({
      id: 'english',
      skillId: 'languages',
      createdAt: LONG_AGO,
      schedule: { type: 'weekly', times: 3 },
    })

    // By Wednesday two of three are expected; by Sunday all three.
    expect(review([], WEDNESDAY, [thrice]).behind[0].due).toBe(2)
    expect(review([], NEXT_WEEK, [thrice]).behind[0].due).toBe(3)
  })

  it('never counts more done than the week asked for', () => {
    const once = makeActivity({
      id: 'english',
      skillId: 'languages',
      createdAt: LONG_AGO,
      schedule: { type: 'weekly', times: 1 },
    })
    const logs = [MONDAY, WEDNESDAY, SUNDAY].map(day => log(day, { value: 10 }))

    expect(review(logs, NEXT_WEEK, [once]).onTrack[0]).toMatchObject({
      due: 1,
      done: 1,
    })
  })

  it('does not hold an activity to days before it was created', () => {
    const fresh = makeActivity({
      id: 'english',
      skillId: 'languages',
      createdAt: new Date(2026, 9, 9, 12).getTime(),
    })

    // Created on Friday: Friday, Saturday and Sunday are asked for.
    expect(review([], NEXT_WEEK, [fresh]).behind[0].due).toBe(3)
  })

  it('counts from an earlier day when something was logged back to it', () => {
    const fresh = makeActivity({
      id: 'english',
      skillId: 'languages',
      createdAt: new Date(2026, 9, 9, 12).getTime(),
    })
    const logs = [log(WEDNESDAY, { value: 10 })]

    expect(review(logs, NEXT_WEEK, [fresh]).behind[0]).toMatchObject({
      due: 5,
      done: 1,
    })
  })

  it('leaves out archived activities and ones the week did not ask for', () => {
    const archived = makeActivity({
      id: 'old',
      archived: true,
      createdAt: LONG_AGO,
    })
    const later = makeActivity({
      id: 'later',
      createdAt: new Date(2026, 9, 20).getTime(),
    })
    const result = review([], NEXT_WEEK, [archived, later])

    expect([...result.behind, ...result.onTrack]).toEqual([])
  })

  it('lists the furthest behind first', () => {
    const reading = makeActivity({ id: 'reading', createdAt: LONG_AGO + 1 })
    const logs = [
      log(MONDAY, { value: 10 }),
      makeLog({ activityId: 'reading', day: MONDAY, value: 10 }),
      makeLog({ activityId: 'reading', day: WEDNESDAY, value: 10 }),
    ]

    expect(
      review(logs, NEXT_WEEK, [daily, reading]).behind.map(
        item => item.activity.id,
      ),
    ).toEqual(['english', 'reading'])
  })
})
