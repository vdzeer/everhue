import { useId, useState, type FormEvent } from 'react'
import { useTheme } from 'styled-components'

import {
  Button,
  DateInput,
  Field,
  Grow,
  Icon,
  IconTile,
  ProgressBar,
  Row,
  Stack,
  Text,
  TextInput,
} from '~/components'
import type { DayKey, Goal, GoalProgress } from '~/core'
import { formatPercent } from '~/services/format'

import {
  GOAL_ICON,
  GOAL_KIND_LABEL,
  goalAmount,
  goalDeadlineLabel,
  goalProgressLabel,
  goalRealm,
  goalWarning,
  parseNumber,
  type GoalContext,
} from '../../services'

import {
  AmountField,
  Box,
  Head,
  InlineForm,
  Pill,
  StepButton,
  Steps,
  Wrap,
} from './styled'

type Props = {
  progress: GoalProgress
  context: GoalContext
  today: DayKey
  /** Its editor is open. */
  selected: boolean
  onEdit: (goal: Goal) => void
  onToggleStep: (goal: Goal, stepId: string) => void
  /** A negative amount takes money out. */
  onContribute: (goal: Goal, amount: number, day: DayKey) => void
  onArchive: (goal: Goal, archived: boolean) => void
}

export const GoalCard = ({
  progress,
  context,
  today,
  selected,
  onEdit,
  onToggleStep,
  onContribute,
  onArchive,
}: Props) => {
  const { t } = context
  const theme = useTheme()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [day, setDay] = useState<DayKey>(today)

  const { goal, ratio, complete, overdue, money } = progress
  const realm = goalRealm(goal, context)
  const warning = goalWarning(goal, context)
  const deadline = goalDeadlineLabel(progress, context)
  const color = realm ? theme.realms[realm].solid : theme.colors.accentStrong

  const contribute = (sign: 1 | -1) => {
    const value = parseNumber(amount)
    if (!Number.isFinite(value) || value <= 0 || !day || day > today) return
    onContribute(goal, sign * value, day)
    setAmount('')
    setDay(today)
    setOpen(false)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    contribute(1)
  }

  return (
    <Wrap $reached={complete} $realm={realm}>
      <Head>
        <IconTile
          realm={realm}
          icon={GOAL_ICON[goal.kind]}
          active={ratio > 0}
        />
        <Grow>
          <Stack $gap="xxs">
            <Text as="h3" variant="bodyStrong">
              {goal.name}
            </Text>
            <Text variant="caption" tone="muted">
              {t(GOAL_KIND_LABEL[goal.kind])}
            </Text>
          </Stack>
        </Grow>
        {selected ? (
          <Pill>
            <Text variant="caption" tone="inherit">
              {t('plan_editing')}
            </Text>
          </Pill>
        ) : null}
        {complete ? (
          <Row $gap="xxs" $nowrap>
            <Icon name="check" size="sm" />
            <Text variant="label">{t('goal_reached')}</Text>
          </Row>
        ) : (
          <Text variant="stat">{formatPercent(ratio)}</Text>
        )}
        <Button
          variant="ghost"
          icon="chevron"
          aria-label={`${t('goal_edit')}: ${goal.name}`}
          onClick={() => onEdit(goal)}
        />
      </Head>

      <ProgressBar
        ratio={ratio}
        color={color}
        label={t('progress_label', { percent: formatPercent(ratio) })}
      />

      <Row $justify="space-between" $align="baseline" $gap="xs">
        <Text variant="secondary">{goalProgressLabel(progress, context)}</Text>
        {deadline ? (
          <Text variant="secondary" tone={overdue ? 'danger' : 'muted'}>
            {deadline}
          </Text>
        ) : null}
      </Row>

      {warning ? (
        <Text variant="secondary" tone="danger">
          {t(warning)}
        </Text>
      ) : null}

      {money && !complete ? (
        <Stack $gap="xxs">
          {money.monthlyNeeded !== null ? (
            <Text variant="secondary" tone="muted">
              {t('goal_monthly_needed', {
                amount: goalAmount(
                  goal,
                  Math.ceil(money.monthlyNeeded),
                  context,
                ),
              })}
            </Text>
          ) : null}
          <Text variant="secondary" tone="muted">
            {goal.monthlyPlan > 0
              ? t('goal_month_plan', {
                  done: goalAmount(goal, money.monthIn, context),
                  plan: goalAmount(goal, goal.monthlyPlan, context),
                })
              : t('goal_month_in', {
                  done: goalAmount(goal, money.monthIn, context),
                })}
          </Text>
        </Stack>
      ) : null}

      {goal.kind === 'steps' ? (
        <Steps>
          {goal.steps.map(step => (
            <li key={step.id}>
              <StepButton
                type="button"
                aria-pressed={step.done}
                disabled={goal.archived}
                onClick={() => onToggleStep(goal, step.id)}>
                <Box $done={step.done}>
                  {step.done ? <Icon name="check" size="sm" /> : null}
                </Box>
                <Text tone={step.done ? 'muted' : 'default'}>{step.name}</Text>
              </StepButton>
            </li>
          ))}
        </Steps>
      ) : null}

      {goal.kind === 'money' && !goal.archived && open ? (
        <InlineForm onSubmit={submit}>
          <AmountField>
            <Field label={t('goal_amount_label')} htmlFor={`${id}-amount`}>
              <TextInput
                id={`${id}-amount`}
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                value={amount}
                onChange={event => setAmount(event.target.value)}
              />
            </Field>
          </AmountField>
          <Field label={t('goal_day_label')} htmlFor={`${id}-day`}>
            <DateInput
              id={`${id}-day`}
              max={today}
              value={day}
              onChange={event => setDay(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary">
            {t('goal_contribute')}
          </Button>
          <Button onClick={() => contribute(-1)}>{t('goal_withdraw')}</Button>
          <Button
            variant="ghost"
            icon="close"
            aria-label={t('action_cancel')}
            onClick={() => setOpen(false)}
          />
        </InlineForm>
      ) : null}

      {goal.kind === 'money' && !goal.archived && !open ? (
        <Row>
          <Button
            variant={complete ? 'secondary' : 'primary'}
            icon="plus"
            onClick={() => setOpen(true)}>
            {t('goal_contribute')}
          </Button>
          {complete ? (
            <Button onClick={() => onArchive(goal, true)}>
              {t('goal_archive')}
            </Button>
          ) : null}
        </Row>
      ) : null}

      {goal.kind !== 'money' && complete && !goal.archived ? (
        <Row>
          <Button onClick={() => onArchive(goal, true)}>
            {t('goal_archive')}
          </Button>
        </Row>
      ) : null}

      {goal.archived ? (
        <Row>
          <Button onClick={() => onArchive(goal, false)}>
            {t('goal_restore')}
          </Button>
        </Row>
      ) : null}
    </Wrap>
  )
}
