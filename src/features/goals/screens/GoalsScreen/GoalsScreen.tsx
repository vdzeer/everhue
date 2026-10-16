'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Button,
  Card,
  Columns,
  EditorColumn,
  ListColumn,
  PageHeader,
  Row,
  Stack,
  StatePanel,
  Text,
} from '~/components'
import {
  buildGoals,
  buildHero,
  type DayKey,
  type Goal,
  type GoalProgress,
} from '~/core'
import {
  useTrackingActions,
  useTrackingData,
  type GoalInput,
} from '~/features/tracking/hooks'
import { useLocale, useToday } from '~/hooks'
import { useT } from '~/services/i18n'

import { GoalCard, GoalForm } from '../../components'
import type { GoalContext } from '../../services'

/** What the editor panel on the right is showing. `id: null` means "new". */
type Selection = { type: 'none' } | { type: 'goal'; id: string | null }

const NOTHING: Selection = { type: 'none' }

export const GoalsScreen = () => {
  const t = useT()
  const locale = useLocale()
  const today = useToday()
  const { state, skills, activities, logs, goals, entries, xpLogs, retry } =
    useTrackingData()
  const actions = useTrackingActions()
  const [selection, setSelection] = useState<Selection>(NOTHING)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Where the columns are stacked the editor can open off screen: bring its
  // top into view, and leave the page alone when it is already there.
  useEffect(() => {
    const editor = editorRef.current
    if (selection.type === 'none' || !editor) return
    const { top } = editor.getBoundingClientRect()
    if (top < 0 || top > window.innerHeight / 2) {
      editor.scrollIntoView({ block: 'start' })
    }
  }, [selection])

  const visibleSkills = useMemo(
    () =>
      skills
        .filter(skill => !skill.archived)
        .sort((a, b) => a.createdAt - b.createdAt),
    [skills],
  )
  const visibleActivities = useMemo(
    () =>
      activities
        .filter(activity => !activity.archived)
        .sort((a, b) => a.createdAt - b.createdAt),
    [activities],
  )

  const view = useMemo(
    () =>
      buildGoals(
        goals,
        {
          logs,
          entries,
          xpBySkill: buildHero(skills, xpLogs, today).xp.bySkill,
        },
        today,
      ),
    [goals, logs, entries, skills, xpLogs, today],
  )

  const context: GoalContext = useMemo(
    () => ({ activities, skills, locale, t }),
    [activities, skills, locale, t],
  )

  const selectedGoal =
    selection.type === 'goal'
      ? goals.find(goal => goal.id === selection.id)
      : undefined

  const save = (input: GoalInput) => {
    actions.saveGoal(input, selectedGoal)
    setSelection(NOTHING)
  }

  const remove = (goal: Goal) => {
    if (!window.confirm(t('confirm_delete_goal'))) return
    actions.deleteGoal(goal)
    setSelection(NOTHING)
  }

  const contribute = (goal: Goal, amount: number, day: DayKey) =>
    actions.addEntry({ goal, amount, day })

  const card = (progress: GoalProgress) => (
    <GoalCard
      key={progress.goal.id}
      progress={progress}
      context={context}
      today={today}
      selected={selection.type === 'goal' && selection.id === progress.goal.id}
      onEdit={goal => setSelection({ type: 'goal', id: goal.id })}
      onToggleStep={actions.toggleGoalStep}
      onContribute={contribute}
      onArchive={actions.setGoalArchived}
    />
  )

  const hasGoals = goals.length > 0

  return (
    <>
      <PageHeader>
        <Stack $gap="xxs">
          <Text as="h1" variant="display" narrowVariant="hero">
            {t('goals_title')}
          </Text>
          <Text tone="muted">{t('goals_subtitle')}</Text>
        </Stack>
        {state === 'ready' && hasGoals ? (
          <Row>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setSelection({ type: 'goal', id: null })}>
              {t('goals_add')}
            </Button>
          </Row>
        ) : null}
      </PageHeader>

      {state === 'loading' ? (
        <StatePanel role="status" title={t('state_loading')} />
      ) : null}

      {state === 'error' ? (
        <StatePanel
          role="alert"
          title={t('state_error_title')}
          text={t('state_error_text')}
          actions={<Button onClick={retry}>{t('action_retry')}</Button>}
        />
      ) : null}

      {state === 'ready' ? (
        <Columns>
          <ListColumn>
            {hasGoals ? null : (
              <StatePanel
                title={t('goals_empty_title')}
                text={t('goals_empty_text')}
                actions={
                  <Button
                    variant="primary"
                    icon="plus"
                    onClick={() => setSelection({ type: 'goal', id: null })}>
                    {t('goals_add')}
                  </Button>
                }
              />
            )}

            {view.active.map(card)}

            {view.reached.length > 0 ? (
              <Stack
                as="section"
                $gap="sm"
                aria-label={t('goals_reached_section')}>
                <Text as="h2" variant="label" tone="muted">
                  {t('goals_reached_section')}
                </Text>
                {view.reached.map(card)}
              </Stack>
            ) : null}

            {view.archived.length > 0 ? (
              <Stack
                as="section"
                $gap="sm"
                aria-label={t('goals_archive_section')}>
                <Row>
                  <Button
                    variant="ghost"
                    aria-pressed={archiveOpen}
                    onClick={() => setArchiveOpen(!archiveOpen)}>
                    {t(
                      archiveOpen ? 'goals_hide_archive' : 'goals_show_archive',
                    )}
                  </Button>
                </Row>
                {archiveOpen ? view.archived.map(card) : null}
              </Stack>
            ) : null}
          </ListColumn>

          <EditorColumn ref={editorRef} $open={selection.type !== 'none'}>
            {selection.type === 'none' && hasGoals ? (
              <Card>
                <Text tone="muted">{t('goals_pick_hint')}</Text>
              </Card>
            ) : null}
            {selection.type === 'goal' ? (
              <Card>
                <GoalForm
                  // A different goal is a different form, not new props.
                  key={selection.id ?? 'new'}
                  goal={selectedGoal}
                  skills={visibleSkills}
                  activities={visibleActivities}
                  today={today}
                  onSave={save}
                  onDelete={remove}
                />
              </Card>
            ) : null}
          </EditorColumn>
        </Columns>
      ) : null}
    </>
  )
}
