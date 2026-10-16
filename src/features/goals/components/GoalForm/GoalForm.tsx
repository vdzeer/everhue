import { useFormik, type FormikErrors } from 'formik'
import { useId } from 'react'

import {
  Button,
  DateInput,
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
  CURRENCIES,
  GOAL_KINDS,
  type Activity,
  type DayKey,
  type Goal,
  type Skill,
} from '~/core'
import type { GoalInput } from '~/features/tracking/hooks'
import { activityMeta } from '~/features/tracking/services'
import { useT, type TranslationKey } from '~/services/i18n'

import {
  GOAL_KIND_HINT,
  GOAL_KIND_LABEL,
  MAX_GOAL_ACTIVITIES,
  MAX_STEPS,
  countedAlike,
  goalFormSchema,
  goalFormValues,
  goalFromForm,
  isTimed,
  type GoalFormValues,
  type StepValues,
} from '../../services'

import { Choice, Choices, Footer, Form, StepRow } from './styled'

type Props = {
  /** Undefined when a new goal is being created. */
  goal: Goal | undefined
  skills: Skill[]
  activities: Activity[]
  today: DayKey
  onSave: (input: GoalInput) => void
  onDelete: (goal: Goal) => void
}

export const GoalForm = ({
  goal,
  skills,
  activities,
  today,
  onSave,
  onDelete,
}: Props) => {
  const t = useT()
  const id = useId()

  const formik = useFormik<GoalFormValues>({
    initialValues: goalFormValues(goal, {
      today,
      defaultSkillId: skills[0]?.id ?? '',
      activities,
    }),
    validationSchema: goalFormSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: values => onSave(goalFromForm(values, activities, today)),
  })

  const { values, errors, setFieldValue } = formik
  const { kind } = values

  // Schema messages are translation keys.
  const message = (error: unknown) =>
    typeof error === 'string' ? t(error as TranslationKey) : undefined

  const stepErrors = (index: number) =>
    (errors.steps as FormikErrors<StepValues>[] | undefined)?.[index]

  const setSteps = (steps: StepValues[]) => setFieldValue('steps', steps)

  const pickKind = (next: GoalFormValues['kind']) => {
    setFieldValue('kind', next)
    // A level goal cannot be saved without a skill; a savings goal can.
    setFieldValue('skillId', next === 'skill' ? (skills[0]?.id ?? '') : '')
  }

  const picked = activities.filter(activity =>
    values.activityIds.includes(activity.id),
  )
  const timed = isTimed(values.activityIds, activities)
  const unit = picked[0]?.kind === 'count' ? picked[0].unit : ''

  const canPick = (activity: Activity) =>
    values.activityIds.includes(activity.id) ||
    (values.activityIds.length < MAX_GOAL_ACTIVITIES &&
      (picked.length === 0 || countedAlike(picked[0], activity)))

  const toggleActivity = (activityId: string) =>
    setFieldValue(
      'activityIds',
      values.activityIds.includes(activityId)
        ? values.activityIds.filter(other => other !== activityId)
        : [...values.activityIds, activityId],
    )

  const targetLabel = () => {
    if (kind === 'money') return t('field_goal_amount')
    if (timed) return t('field_goal_target_hours')
    return [t('field_goal_target_total'), unit].filter(Boolean).join(', ')
  }

  return (
    <Form onSubmit={formik.handleSubmit} noValidate>
      <Text as="h2" variant="title">
        {t(goal ? 'editor_goal' : 'editor_new_goal')}
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

      {/* What a goal measures is chosen once: switching it later would leave
          its contributions or its steps behind. */}
      <Field label={t('field_goal_kind')}>
        <Stack $gap="xs">
          {goal ? null : (
            <Segmented
              label={t('field_goal_kind')}
              options={GOAL_KINDS.map(option => ({
                value: option,
                label: t(GOAL_KIND_LABEL[option]),
              }))}
              selected={[kind]}
              onSelect={pickKind}
            />
          )}
          <Text variant="secondary" tone="muted">
            {goal
              ? `${t(GOAL_KIND_LABEL[kind])}. ${t(GOAL_KIND_HINT[kind])}`
              : t(GOAL_KIND_HINT[kind])}
          </Text>
        </Stack>
      </Field>

      {kind === 'count' ? (
        <Field
          label={t('field_goal_activities')}
          error={message(errors.activityIds)}>
          <Stack $gap="xs">
            {activities.length === 0 ? (
              <Text variant="secondary" tone="muted">
                {t('goals_need_activity')}
              </Text>
            ) : (
              <Choices>
                {activities.map(activity => {
                  const isPicked = values.activityIds.includes(activity.id)
                  return (
                    <Choice
                      key={activity.id}
                      type="button"
                      aria-pressed={isPicked}
                      disabled={!canPick(activity)}
                      $picked={isPicked}
                      onClick={() => toggleActivity(activity.id)}>
                      <Text variant="label" tone="inherit">
                        {activity.name}
                      </Text>
                      <Text variant="caption" tone="inherit">
                        {activityMeta(activity, t)}
                      </Text>
                    </Choice>
                  )
                })}
              </Choices>
            )}
            <Text variant="caption" tone="muted">
              {t('field_goal_activities_hint')}
            </Text>
          </Stack>
        </Field>
      ) : null}

      {kind === 'skill' ? (
        <Row $align="flex-start">
          <Grow>
            <Field
              label={t('field_skill')}
              htmlFor={`${id}-skill`}
              error={message(errors.skillId)}>
              {skills.length === 0 ? (
                <Text variant="secondary" tone="muted">
                  {t('goals_need_skill')}
                </Text>
              ) : (
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
              )}
            </Field>
          </Grow>
          <Field
            label={t('field_goal_level')}
            htmlFor={`${id}-level`}
            error={message(errors.level)}>
            <NumberInput
              id={`${id}-level`}
              name="level"
              inputMode="numeric"
              aria-invalid={Boolean(errors.level)}
              value={values.level}
              onChange={formik.handleChange}
            />
          </Field>
        </Row>
      ) : null}

      {kind === 'steps' ? (
        <Field
          label={t('field_goal_steps')}
          error={
            typeof errors.steps === 'string' ? message(errors.steps) : undefined
          }>
          <Stack $gap="xs">
            {values.steps.map((step, index) => (
              <Stack key={step.id} $gap="xxs">
                <StepRow>
                  <TextInput
                    aria-label={t('step_name')}
                    aria-invalid={Boolean(stepErrors(index)?.name)}
                    autoComplete="off"
                    value={step.name}
                    onChange={event =>
                      setSteps(
                        values.steps.map(other =>
                          other.id === step.id
                            ? { ...other, name: event.target.value }
                            : other,
                        ),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    icon="close"
                    aria-label={`${t('step_remove')}: ${step.name}`}
                    onClick={() =>
                      setSteps(
                        values.steps.filter(other => other.id !== step.id),
                      )
                    }
                  />
                </StepRow>
                {stepErrors(index)?.name ? (
                  <Text variant="caption" tone="danger">
                    {message(stepErrors(index)?.name)}
                  </Text>
                ) : null}
              </Stack>
            ))}
            {values.steps.length < MAX_STEPS ? (
              <Row>
                <Button
                  variant="ghost"
                  icon="plus"
                  onClick={() =>
                    setSteps([
                      ...values.steps,
                      {
                        id: crypto.randomUUID().slice(0, 8),
                        name: '',
                        done: false,
                      },
                    ])
                  }>
                  {t('step_add')}
                </Button>
              </Row>
            ) : null}
          </Stack>
        </Field>
      ) : null}

      {kind === 'count' || kind === 'money' ? (
        <Row $align="flex-start">
          <Grow>
            <Field
              label={targetLabel()}
              htmlFor={`${id}-target`}
              error={message(errors.target)}>
              <TextInput
                id={`${id}-target`}
                name="target"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(errors.target)}
                value={values.target}
                onChange={formik.handleChange}
              />
            </Field>
          </Grow>
          {kind === 'money' ? (
            <Field label={t('field_goal_currency')} htmlFor={`${id}-currency`}>
              <SelectInput
                id={`${id}-currency`}
                name="currency"
                value={values.currency}
                onChange={formik.handleChange}>
                {CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}
        </Row>
      ) : null}

      {kind === 'money' ? (
        <>
          <Field
            label={t('field_goal_plan')}
            htmlFor={`${id}-plan`}
            error={message(errors.monthlyPlan)}>
            <TextInput
              id={`${id}-plan`}
              name="monthlyPlan"
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={Boolean(errors.monthlyPlan)}
              value={values.monthlyPlan}
              onChange={formik.handleChange}
            />
          </Field>
          <Field label={t('field_goal_skill')} htmlFor={`${id}-trains`}>
            <Stack $gap="xs">
              <SelectInput
                id={`${id}-trains`}
                name="skillId"
                value={values.skillId}
                onChange={formik.handleChange}>
                <option value="">{t('goal_skill_none')}</option>
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </SelectInput>
              <Text variant="caption" tone="muted">
                {t('goal_xp_note')}
              </Text>
            </Stack>
          </Field>
        </>
      ) : null}

      {kind === 'count' ? (
        <Field
          label={t('field_goal_start')}
          htmlFor={`${id}-start`}
          error={message(errors.startDay)}>
          <DateInput
            id={`${id}-start`}
            name="startDay"
            aria-invalid={Boolean(errors.startDay)}
            value={values.startDay}
            onChange={formik.handleChange}
          />
        </Field>
      ) : null}

      <Field
        label={t('field_goal_deadline')}
        htmlFor={`${id}-deadline`}
        error={message(errors.deadline)}>
        <DateInput
          id={`${id}-deadline`}
          name="deadline"
          aria-invalid={Boolean(errors.deadline)}
          value={values.deadline}
          onChange={formik.handleChange}
        />
      </Field>

      <Footer>
        {goal ? (
          <Button variant="danger" onClick={() => onDelete(goal)}>
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
