import { useFormik, type FormikErrors } from 'formik'
import { useId } from 'react'

import {
  Button,
  Field,
  Grow,
  NumberInput,
  Row,
  Segmented,
  SelectInput,
  Stack,
  Text,
  TextInput,
} from '~/components'
import {
  ACTIVITY_KINDS,
  type Activity,
  type ActivityKind,
  type Schedule,
  type Skill,
} from '~/core'
import type { ActivityInput } from '~/features/tracking/hooks'
import { WEEKDAY_KEYS } from '~/features/tracking/services'
import { formatAmount } from '~/services/format'
import { useT, type TranslationKey } from '~/services/i18n'

import {
  MAX_PARTS,
  activityFormSchema,
  activityFormValues,
  activityFromForm,
  parseNumber,
  type ActivityFormValues,
  type PartValues,
} from '../../services'

import { Footer, Form, PartRow } from './styled'

const KIND_LABEL: Record<ActivityKind, TranslationKey> = {
  time: 'kind_time',
  count: 'kind_count',
  check: 'kind_check',
}

const SCHEDULE_TYPES: Schedule['type'][] = ['daily', 'weekdays', 'weekly']

const SCHEDULE_LABEL: Record<Schedule['type'], TranslationKey> = {
  daily: 'schedule_type_daily',
  weekdays: 'schedule_type_weekdays',
  weekly: 'schedule_type_weekly',
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

type Props = {
  /** Undefined when a new activity is being created. */
  activity: Activity | undefined
  skills: Skill[]
  onSave: (input: ActivityInput) => void
  onDelete: (activity: Activity) => void
}

export const ActivityForm = ({ activity, skills, onSave, onDelete }: Props) => {
  const t = useT()
  const id = useId()

  const formik = useFormik<ActivityFormValues>({
    initialValues: activityFormValues(activity, skills[0]?.id ?? ''),
    validationSchema: activityFormSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: values => onSave(activityFromForm(values)),
  })

  const { values, errors, setFieldValue } = formik
  const isCheck = values.kind === 'check'
  const isCount = values.kind === 'count'
  const unit = isCount ? values.unit : t('unit_min')

  // Schema messages are translation keys.
  const message = (error: unknown) =>
    typeof error === 'string' ? t(error as TranslationKey) : undefined

  const partErrors = (index: number) =>
    (errors.parts as FormikErrors<PartValues>[] | undefined)?.[index]

  const setParts = (parts: PartValues[]) => setFieldValue('parts', parts)

  const changePart = (index: number, patch: Partial<PartValues>) =>
    setParts(
      values.parts.map((part, position) =>
        position === index ? { ...part, ...patch } : part,
      ),
    )

  const addPart = () =>
    setParts([
      ...values.parts,
      { id: crypto.randomUUID().slice(0, 8), name: '', target: '5' },
    ])

  const toggleDay = (day: number) =>
    setFieldValue(
      'days',
      values.days.includes(day)
        ? values.days.filter(other => other !== day)
        : [...values.days, day],
    )

  const partsTotal = values.parts.reduce((sum, part) => {
    const target = parseNumber(part.target)
    return sum + (Number.isFinite(target) ? target : 0)
  }, 0)

  return (
    <Form onSubmit={formik.handleSubmit} noValidate>
      <Text as="h2" variant="title">
        {t(activity ? 'editor_activity' : 'editor_new_activity')}
      </Text>

      <Field
        label={t('field_name')}
        htmlFor={`${id}-name`}
        error={message(errors.name)}>
        <TextInput
          id={`${id}-name`}
          name="name"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          value={values.name}
          onChange={formik.handleChange}
        />
      </Field>

      <Field
        label={t('field_skill')}
        htmlFor={`${id}-skill`}
        error={message(errors.skillId)}>
        <SelectInput
          id={`${id}-skill`}
          name="skillId"
          value={values.skillId}
          onChange={formik.handleChange}>
          {skills.map(skill => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field label={t('field_kind')}>
        <Segmented
          label={t('field_kind')}
          options={ACTIVITY_KINDS.map(kind => ({
            value: kind,
            label: t(KIND_LABEL[kind]),
          }))}
          selected={[values.kind]}
          onSelect={kind => setFieldValue('kind', kind)}
        />
      </Field>

      {isCount ? (
        <Row $align="flex-start">
          <Grow>
            <Field
              label={t('field_unit')}
              htmlFor={`${id}-unit`}
              error={message(errors.unit)}>
              <TextInput
                id={`${id}-unit`}
                name="unit"
                autoComplete="off"
                placeholder={t('field_unit_hint')}
                value={values.unit}
                onChange={formik.handleChange}
              />
            </Field>
          </Grow>
          <Field
            label={t('field_minutes_per_unit')}
            htmlFor={`${id}-mpu`}
            error={message(errors.minutesPerUnit)}>
            <NumberInput
              id={`${id}-mpu`}
              name="minutesPerUnit"
              inputMode="decimal"
              aria-invalid={Boolean(errors.minutesPerUnit)}
              value={values.minutesPerUnit}
              onChange={formik.handleChange}
            />
          </Field>
        </Row>
      ) : null}

      {isCheck ? (
        <Field
          label={t('field_effort')}
          htmlFor={`${id}-effort`}
          error={message(errors.effortMinutes)}>
          <NumberInput
            id={`${id}-effort`}
            name="effortMinutes"
            inputMode="decimal"
            aria-invalid={Boolean(errors.effortMinutes)}
            value={values.effortMinutes}
            onChange={formik.handleChange}
          />
        </Field>
      ) : null}

      {!isCheck && values.parts.length === 0 ? (
        <Field
          label={t(isCount ? 'field_target_count' : 'field_target_time')}
          htmlFor={`${id}-target`}
          error={message(errors.target)}>
          <NumberInput
            id={`${id}-target`}
            name="target"
            inputMode="decimal"
            aria-invalid={Boolean(errors.target)}
            value={values.target}
            onChange={formik.handleChange}
          />
        </Field>
      ) : null}

      {isCheck ? null : (
        <Field label={t('field_parts')}>
          <Stack $gap="xs">
            {values.parts.map((part, index) => (
              <Stack key={part.id} $gap="xxs">
                <PartRow>
                  <TextInput
                    aria-label={t('part_name')}
                    aria-invalid={Boolean(partErrors(index)?.name)}
                    autoComplete="off"
                    value={part.name}
                    onChange={event =>
                      changePart(index, { name: event.target.value })
                    }
                  />
                  <NumberInput
                    aria-label={t('part_target')}
                    aria-invalid={Boolean(partErrors(index)?.target)}
                    inputMode="decimal"
                    value={part.target}
                    onChange={event =>
                      changePart(index, { target: event.target.value })
                    }
                  />
                  <Button
                    variant="ghost"
                    icon="close"
                    aria-label={`${t('part_remove')}: ${part.name}`}
                    onClick={() =>
                      setParts(
                        values.parts.filter(other => other.id !== part.id),
                      )
                    }
                  />
                </PartRow>
                {partErrors(index) ? (
                  <Text variant="caption" tone="danger">
                    {message(partErrors(index)?.name) ??
                      message(partErrors(index)?.target)}
                  </Text>
                ) : null}
              </Stack>
            ))}
            {values.parts.length < MAX_PARTS ? (
              <Row>
                <Button variant="ghost" icon="plus" onClick={addPart}>
                  {t('part_add')}
                </Button>
              </Row>
            ) : null}
            {values.parts.length > 0 ? (
              <Text variant="secondary" tone="muted">
                {t('parts_total', { total: formatAmount(partsTotal), unit })}
              </Text>
            ) : null}
          </Stack>
        </Field>
      )}

      <Field
        label={t('field_schedule')}
        error={message(errors.days) ?? message(errors.times)}>
        <Stack $gap="xs">
          <Segmented
            label={t('field_schedule')}
            options={SCHEDULE_TYPES.map(type => ({
              value: type,
              label: t(SCHEDULE_LABEL[type]),
            }))}
            selected={[values.scheduleType]}
            onSelect={type => setFieldValue('scheduleType', type)}
          />
          {values.scheduleType === 'weekdays' ? (
            <Segmented
              label={t('field_days')}
              options={WEEKDAYS.map(day => ({
                value: day,
                label: t(WEEKDAY_KEYS[day - 1]),
              }))}
              selected={values.days}
              onSelect={toggleDay}
            />
          ) : null}
          {values.scheduleType === 'weekly' ? (
            <Row>
              <Text as="label" htmlFor={`${id}-times`} variant="secondary">
                {t('field_times')}
              </Text>
              <NumberInput
                id={`${id}-times`}
                name="times"
                inputMode="numeric"
                aria-invalid={Boolean(errors.times)}
                value={values.times}
                onChange={formik.handleChange}
              />
            </Row>
          ) : null}
        </Stack>
      </Field>

      <Footer>
        {activity ? (
          <Button variant="danger" onClick={() => onDelete(activity)}>
            {t('action_delete')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary">
          {t('action_save')}
        </Button>
      </Footer>
    </Form>
  )
}
