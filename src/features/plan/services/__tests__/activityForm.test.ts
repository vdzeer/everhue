import {
  activityFormSchema,
  activityFormValues,
  activityFromForm,
  type ActivityFormValues,
} from '../activityForm'

const valid = (
  overrides: Partial<ActivityFormValues> = {},
): ActivityFormValues => ({
  ...activityFormValues(undefined, 'skill-1'),
  name: 'English',
  ...overrides,
})

const errorsOf = (values: ActivityFormValues) => {
  try {
    activityFormSchema.validateSync(values, { abortEarly: false })
    return []
  } catch (error) {
    return (error as { inner: { path: string; message: string }[] }).inner.map(
      issue => `${issue.path}: ${issue.message}`,
    )
  }
}

describe('activityFormSchema', () => {
  it('accepts the defaults once a name is typed', () => {
    expect(errorsOf(valid())).toEqual([])
  })

  it('needs a name and a skill', () => {
    expect(errorsOf(valid({ name: '  ', skillId: '' }))).toEqual([
      'name: error_required',
      'skillId: error_required',
    ])
  })

  it('needs a positive daily target for a timed activity without parts', () => {
    expect(errorsOf(valid({ target: '0' }))).toEqual(['target: error_positive'])
    expect(errorsOf(valid({ target: 'ten' }))).toEqual([
      'target: error_positive',
    ])
    expect(errorsOf(valid({ target: '7,5' }))).toEqual([])
  })

  it('ignores the daily target when parts add up to it', () => {
    const values = valid({
      target: '',
      parts: [{ id: 'p1', name: 'Anki', target: '5' }],
    })

    expect(errorsOf(values)).toEqual([])
  })

  it('checks every part', () => {
    const values = valid({
      parts: [
        { id: 'p1', name: '', target: '5' },
        { id: 'p2', name: 'Podcast', target: '-1' },
      ],
    })

    expect(errorsOf(values)).toEqual([
      'parts[0].name: error_required',
      'parts[1].target: error_positive',
    ])
  })

  it('needs minutes per unit only for a counted activity', () => {
    expect(errorsOf(valid({ minutesPerUnit: '' }))).toEqual([])
    expect(errorsOf(valid({ kind: 'count', minutesPerUnit: '' }))).toEqual([
      'minutesPerUnit: error_positive',
    ])
  })

  it('needs an effort only for a yes-or-no activity, and no target', () => {
    expect(
      errorsOf(valid({ kind: 'check', target: '', effortMinutes: '0' })),
    ).toEqual(['effortMinutes: error_positive'])
    expect(
      errorsOf(valid({ kind: 'check', target: '', effortMinutes: '5' })),
    ).toEqual([])
  })

  it('needs at least one day for a weekday schedule', () => {
    expect(errorsOf(valid({ scheduleType: 'weekdays', days: [] }))).toEqual([
      'days: error_days',
    ])
  })

  it('accepts 1 to 7 times a week', () => {
    const weekly = (times: string) => valid({ scheduleType: 'weekly', times })

    expect(errorsOf(weekly('3'))).toEqual([])
    expect(errorsOf(weekly('0'))).toEqual(['times: error_positive'])
    expect(errorsOf(weekly('8'))).toEqual(['times: error_positive'])
    expect(errorsOf(weekly('2.5'))).toEqual(['times: error_positive'])
  })
})

describe('activityFromForm', () => {
  it('builds a timed activity whose target is the sum of its parts', () => {
    const input = activityFromForm(
      valid({
        name: ' English ',
        target: '99',
        parts: [
          { id: 'p1', name: ' Anki ', target: '5' },
          { id: 'p2', name: 'Podcast', target: '5' },
        ],
      }),
    )

    expect(input).toEqual({
      name: 'English',
      skillId: 'skill-1',
      kind: 'time',
      target: 10,
      unit: '',
      minutesPerUnit: 1,
      effortMinutes: 0,
      parts: [
        { id: 'p1', name: 'Anki', target: 5 },
        { id: 'p2', name: 'Podcast', target: 5 },
      ],
      schedule: { type: 'daily' },
    })
  })

  it('keeps unit and conversion for a counted activity', () => {
    const input = activityFromForm(
      valid({
        kind: 'count',
        target: '20',
        unit: 'pages',
        minutesPerUnit: '1,5',
      }),
    )

    expect(input).toMatchObject({
      kind: 'count',
      target: 20,
      unit: 'pages',
      minutesPerUnit: 1.5,
    })
  })

  it('drops what a yes-or-no activity cannot have', () => {
    const input = activityFromForm(
      valid({
        kind: 'check',
        unit: 'pages',
        effortMinutes: '5',
        parts: [{ id: 'p1', name: 'Anki', target: '5' }],
      }),
    )

    expect(input).toMatchObject({
      target: 1,
      unit: '',
      effortMinutes: 5,
      parts: [],
    })
  })

  it('sorts weekdays and reads the weekly count', () => {
    expect(
      activityFromForm(valid({ scheduleType: 'weekdays', days: [5, 1, 3] }))
        .schedule,
    ).toEqual({ type: 'weekdays', days: [1, 3, 5] })
    expect(
      activityFromForm(valid({ scheduleType: 'weekly', times: '3' })).schedule,
    ).toEqual({ type: 'weekly', times: 3 })
  })

  it('round-trips an existing activity through the form', () => {
    const input = activityFromForm(
      valid({ scheduleType: 'weekly', times: '2', target: '45' }),
    )
    const activity = {
      ...input,
      id: 'a1',
      ownerUid: 'u1',
      archived: false,
      createdAt: 1,
    }

    expect(activityFromForm(activityFormValues(activity, 'other'))).toEqual(
      input,
    )
  })
})
