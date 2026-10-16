import { dailyTarget } from '~/core'
import type { Translate } from '~/services/i18n'
import { LOCALES, LOCALE_IDS } from '~/services/i18n/locales'

import { buildStarterSet } from '../starterSet'

const translator =
  (locale: (typeof LOCALE_IDS)[number]): Translate =>
  key =>
    LOCALES[locale].strings[key] as string

const build = (locale: (typeof LOCALE_IDS)[number]) => {
  let next = 0
  return buildStarterSet(translator(locale), {
    newId: () => {
      next += 1
      return `id-${next}`
    },
    ownerUid: 'user-1',
    now: 1000,
  })
}

describe.each(LOCALE_IDS)('starter set in %s', locale => {
  const { skills, activities } = build(locale)

  it('gives every skill and activity a name', () => {
    const names = [...skills, ...activities].map(item => item.name.trim())

    expect(names.filter(name => name === '')).toEqual([])
  })

  it('uses a distinct id for every skill, activity and part', () => {
    const ids = [
      ...skills.map(skill => skill.id),
      ...activities.map(activity => activity.id),
      ...activities.flatMap(activity => activity.parts.map(part => part.id)),
    ]

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('puts every activity under a skill from the same set', () => {
    const skillIds = skills.map(skill => skill.id)

    expect(
      activities.filter(activity => !skillIds.includes(activity.skillId)),
    ).toEqual([])
  })

  it('belongs to the user who asked for it', () => {
    expect(
      [...skills, ...activities].filter(item => item.ownerUid !== 'user-1'),
    ).toEqual([])
  })

  it('keeps the order it was written in', () => {
    const stamps = activities.map(activity => activity.createdAt)

    expect(stamps).toEqual([...stamps].sort((a, b) => a - b))
    expect(new Set(stamps).size).toBe(stamps.length)
  })

  it('asks for something every day: no activity has an empty target', () => {
    expect(activities.filter(activity => dailyTarget(activity) <= 0)).toEqual(
      [],
    )
  })

  it('names a unit for everything that is counted', () => {
    expect(
      activities.filter(
        activity => activity.kind === 'count' && activity.unit.trim() === '',
      ),
    ).toEqual([])
  })
})
