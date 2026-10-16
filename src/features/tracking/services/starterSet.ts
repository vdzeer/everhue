import type { Activity, Realm, Skill } from '~/core'
import type { Translate } from '~/services/i18n'

type Ids = { newId: () => string; ownerUid: string; now: number }

type StarterSet = { skills: Skill[]; activities: Activity[] }

/**
 * A first set of skills and activities, so a new account opens on a working
 * Today screen instead of four empty ones. Names come from the user's
 * language; everything is ordinary data they can rename or delete.
 */
export const buildStarterSet = (t: Translate, ids: Ids): StarterSet => {
  const skill = (name: string, realm: Realm, order: number): Skill => ({
    id: ids.newId(),
    ownerUid: ids.ownerUid,
    name,
    realm,
    archived: false,
    createdAt: ids.now + order,
  })

  const languages = skill(t('starter_skill_languages'), 'harbor', 0)
  const reading = skill(t('starter_skill_reading'), 'library', 1)
  const strength = skill(t('starter_skill_strength'), 'forge', 2)
  const calm = skill(t('starter_skill_calm'), 'gardens', 3)

  const activity = (
    name: string,
    owner: Skill,
    order: number,
    overrides: Partial<Activity>,
  ): Activity => ({
    id: ids.newId(),
    ownerUid: ids.ownerUid,
    name,
    skillId: owner.id,
    kind: 'time',
    target: 10,
    unit: '',
    minutesPerUnit: 1,
    effortMinutes: 0,
    parts: [],
    schedule: { type: 'daily' },
    archived: false,
    createdAt: ids.now + order,
    ...overrides,
  })

  return {
    skills: [languages, reading, strength, calm],
    activities: [
      activity(t('starter_english'), languages, 0, {
        parts: [
          { id: ids.newId(), name: t('starter_part_cards'), target: 5 },
          { id: ids.newId(), name: t('starter_part_podcast'), target: 5 },
        ],
      }),
      activity(t('starter_reading'), reading, 1, {
        kind: 'count',
        target: 20,
        unit: t('starter_unit_pages'),
        minutesPerUnit: 1.5,
      }),
      activity(t('starter_workout'), strength, 2, {
        target: 45,
        schedule: { type: 'weekly', times: 3 },
      }),
      activity(t('starter_meditation'), calm, 3, {}),
      activity(t('starter_bedtime'), calm, 4, {
        kind: 'check',
        target: 1,
        effortMinutes: 5,
      }),
    ],
  }
}
