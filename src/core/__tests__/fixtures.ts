import type { Activity, Goal, GoalEntry, Log, Skill } from '../types'

let sequence = 0
const nextId = (prefix: string) => {
  sequence += 1
  return `${prefix}-${sequence}`
}

export const makeSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: nextId('skill'),
  ownerUid: 'user-1',
  name: 'Languages',
  realm: 'harbor',
  archived: false,
  createdAt: 1,
  ...overrides,
})

export const makeActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: nextId('activity'),
  ownerUid: 'user-1',
  name: 'English',
  skillId: 'skill-languages',
  kind: 'time',
  target: 10,
  unit: '',
  minutesPerUnit: 1,
  effortMinutes: 0,
  parts: [],
  schedule: { type: 'daily' },
  archived: false,
  createdAt: 1,
  ...overrides,
})

export const makeLog = (overrides: Partial<Log> = {}): Log => {
  sequence += 1
  return {
    id: `log-${sequence}`,
    ownerUid: 'user-1',
    activityId: 'activity-english',
    skillId: 'skill-languages',
    day: '2026-10-12',
    kind: 'time',
    value: 10,
    effortMinutes: 10,
    source: 'manual',
    partId: '',
    // Later logs sort later unless a test says otherwise.
    createdAt: sequence,
    ...overrides,
  }
}

export const makeGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: nextId('goal'),
  ownerUid: 'user-1',
  name: 'Laptop',
  kind: 'money',
  target: 60000,
  activityIds: [],
  skillId: '',
  steps: [],
  currency: 'UAH',
  monthlyPlan: 0,
  startDay: '2026-10-01',
  deadline: '',
  archived: false,
  createdAt: 1,
  ...overrides,
})

export const makeEntry = (overrides: Partial<GoalEntry> = {}): GoalEntry => {
  sequence += 1
  return {
    id: `entry-${sequence}`,
    ownerUid: 'user-1',
    goalId: 'goal-laptop',
    amount: 1000,
    day: '2026-10-12',
    createdAt: sequence,
    ...overrides,
  }
}
