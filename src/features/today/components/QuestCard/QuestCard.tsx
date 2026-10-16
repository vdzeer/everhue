import { useId, useState, type FormEvent } from 'react'
import { useTheme } from 'styled-components'

import {
  Button,
  Grow,
  Icon,
  IconTile,
  NumberInput,
  ProgressBar,
  Row,
  Text,
} from '~/components'
import type { Quest } from '~/core'
import { unitLabel } from '~/features/tracking/services'
import { formatAmount, formatPercent } from '~/services/format'
import { useT } from '~/services/i18n'

import { Actions, Body, InlineForm, PartChip, Wrap } from './styled'

type Props = {
  quest: Quest
  /** The first quest in the list carries the filled button. */
  primary: boolean
  /** Another activity's timer is running, so this one cannot start. */
  timerBusy: boolean
  /** False for a past day: time is then typed in, not measured. */
  timerAllowed: boolean
  onStart: (quest: Quest) => void
  onLog: (quest: Quest, value: number) => void
}

const parseAmount = (text: string) => Number(text.replace(',', '.'))

export const QuestCard = ({
  quest,
  primary,
  timerBusy,
  timerAllowed,
  onStart,
  onLog,
}: Props) => {
  const t = useT()
  const theme = useTheme()
  const fieldId = useId()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')

  const { activity, skill } = quest
  const realm = skill?.realm
  const unit = unitLabel(activity, t)
  const variant = primary ? 'primary' : 'secondary'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = parseAmount(amount)
    if (!Number.isFinite(value) || value <= 0) return
    onLog(quest, value)
    setAmount('')
    setOpen(false)
  }

  return (
    <Wrap>
      <IconTile realm={realm} active={quest.started} />
      <Body>
        <Row $justify="space-between" $align="baseline" $nowrap>
          <Grow>
            <Text variant="bodyStrong">{activity.name}</Text>
          </Grow>
          {activity.kind === 'check' ? null : (
            <Text variant="secondary" tone="muted">
              {t('progress_of', {
                done: formatAmount(quest.done),
                target: formatAmount(quest.target),
                unit,
              })}
            </Text>
          )}
        </Row>
        <ProgressBar
          ratio={quest.ratio}
          color={
            realm ? theme.realms[realm].solid : theme.colors.onSurfaceMuted
          }
          label={t('progress_label', { percent: formatPercent(quest.ratio) })}
        />
        {quest.parts.length > 0 ? (
          <Row $gap="xs">
            {quest.parts.map(part => (
              <PartChip key={part.id} $done={part.complete} $realm={realm}>
                {part.complete ? <Icon name="check" size="sm" /> : null}
                <Text variant="caption" tone="inherit">
                  {`${part.name} · ${formatAmount(part.target)} ${unit}`}
                </Text>
              </PartChip>
            ))}
          </Row>
        ) : null}
        {quest.weekly ? (
          <Text variant="caption" tone="muted">
            {t('week_progress', {
              done: quest.weekly.completedDays,
              times: quest.weekly.times,
            })}
          </Text>
        ) : null}
        {open ? (
          <InlineForm onSubmit={submit}>
            <Text as="label" htmlFor={fieldId} variant="label">
              {t(
                activity.kind === 'time'
                  ? 'manual_minutes_label'
                  : 'manual_count_label',
              )}
            </Text>
            <NumberInput
              id={fieldId}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              autoFocus
              value={amount}
              onChange={event => setAmount(event.target.value)}
            />
            <Button type="submit" variant="primary">
              {t('action_save')}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('action_cancel')}
            </Button>
          </InlineForm>
        ) : null}
      </Body>
      <Actions>
        {activity.kind === 'time' && timerAllowed ? (
          <>
            <Button
              variant={variant}
              icon="play"
              disabled={timerBusy}
              onClick={() => onStart(quest)}>
              {t('action_start')}
            </Button>
            <Button
              variant="ghost"
              icon="plus"
              aria-label={t('manual_log')}
              onClick={() => setOpen(true)}
            />
          </>
        ) : null}
        {activity.kind === 'count' ||
        (activity.kind === 'time' && !timerAllowed) ? (
          <Button variant={variant} icon="plus" onClick={() => setOpen(true)}>
            {t('action_add')}
          </Button>
        ) : null}
        {activity.kind === 'check' ? (
          <Button
            variant={variant}
            icon="check"
            onClick={() => onLog(quest, 1)}>
            {t('action_done')}
          </Button>
        ) : null}
      </Actions>
    </Wrap>
  )
}
