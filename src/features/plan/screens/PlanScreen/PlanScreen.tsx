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
import { buildHero, type Activity, type Skill } from '~/core'
import {
  newId,
  useTrackingActions,
  useTrackingData,
  type ActivityInput,
  type SkillInput,
} from '~/features/tracking/hooks'
import { buildStarterSet } from '~/features/tracking/services'
import { useToday } from '~/hooks'
import { useT } from '~/services/i18n'
import { useUid } from '~/store'

import { ActivityForm, SkillCard, SkillForm } from '../../components'

/** What the editor panel on the right is showing. `id: null` means "new". */
type Selection =
  | { type: 'none' }
  | { type: 'activity'; id: string | null }
  | { type: 'skill'; id: string | null }

const NOTHING: Selection = { type: 'none' }

export const PlanScreen = () => {
  const t = useT()
  const uid = useUid()
  const today = useToday()
  const { state, skills, activities, xpLogs, retry } = useTrackingData()
  const actions = useTrackingActions()
  const [selection, setSelection] = useState<Selection>(NOTHING)
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
  const levels = useMemo(
    () =>
      Object.fromEntries(
        buildHero(skills, xpLogs, today).skills.map(entry => [
          entry.skill.id,
          entry.progress.level,
        ]),
      ),
    [skills, xpLogs, today],
  )

  const selectedActivity =
    selection.type === 'activity'
      ? visibleActivities.find(activity => activity.id === selection.id)
      : undefined
  const selectedSkill =
    selection.type === 'skill'
      ? visibleSkills.find(skill => skill.id === selection.id)
      : undefined

  const saveActivity = (input: ActivityInput) => {
    actions.saveActivity(input, selectedActivity)
    setSelection(NOTHING)
  }

  const deleteActivity = (activity: Activity) => {
    if (!window.confirm(t('confirm_delete_activity'))) return
    actions.deleteActivity(activity)
    setSelection(NOTHING)
  }

  const saveSkill = (input: SkillInput) => {
    actions.saveSkill(input, selectedSkill)
    setSelection(NOTHING)
  }

  const deleteSkill = (skill: Skill) => {
    if (!window.confirm(t('confirm_delete_skill'))) return
    actions.deleteSkill(skill)
    setSelection(NOTHING)
  }

  const addStarterSet = () => {
    if (!uid) return
    const starter = buildStarterSet(t, {
      newId: () => newId('skills'),
      ownerUid: uid,
      now: Date.now(),
    })
    actions.addMany(starter.skills, starter.activities)
  }

  const hasSkills = visibleSkills.length > 0

  return (
    <>
      <PageHeader>
        <Stack $gap="xxs">
          <Text as="h1" variant="display" narrowVariant="hero">
            {t('plan_title')}
          </Text>
          <Text tone="muted">{t('plan_subtitle')}</Text>
        </Stack>
        {state === 'ready' && hasSkills ? (
          <Row>
            <Button onClick={() => setSelection({ type: 'skill', id: null })}>
              {t('plan_new_skill')}
            </Button>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setSelection({ type: 'activity', id: null })}>
              {t('plan_add_activity')}
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
            {hasSkills ? null : (
              <StatePanel
                title={t('plan_empty_title')}
                text={t('plan_empty_text')}
                actions={
                  <>
                    <Button variant="primary" onClick={addStarterSet}>
                      {t('plan_starter')}
                    </Button>
                    <Button
                      onClick={() => setSelection({ type: 'skill', id: null })}>
                      {t('plan_new_skill')}
                    </Button>
                  </>
                }
              />
            )}
            {visibleSkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                level={levels[skill.id] ?? 0}
                activities={visibleActivities.filter(
                  activity => activity.skillId === skill.id,
                )}
                selectedActivityId={
                  selection.type === 'activity' ? selection.id : null
                }
                onEditSkill={picked =>
                  setSelection({ type: 'skill', id: picked.id })
                }
                onEditActivity={picked =>
                  setSelection({ type: 'activity', id: picked.id })
                }
              />
            ))}
          </ListColumn>

          <EditorColumn ref={editorRef} $open={selection.type !== 'none'}>
            {selection.type === 'none' && hasSkills ? (
              <Card>
                <Text tone="muted">{t('plan_pick_hint')}</Text>
              </Card>
            ) : null}
            {selection.type === 'activity' ? (
              <Card>
                <ActivityForm
                  // A different activity is a different form, not new props.
                  key={selection.id ?? 'new'}
                  activity={selectedActivity}
                  skills={visibleSkills}
                  onSave={saveActivity}
                  onDelete={deleteActivity}
                />
              </Card>
            ) : null}
            {selection.type === 'skill' ? (
              <Card>
                <SkillForm
                  key={selection.id ?? 'new'}
                  skill={selectedSkill}
                  hasActivities={visibleActivities.some(
                    activity => activity.skillId === selection.id,
                  )}
                  onSave={saveSkill}
                  onDelete={deleteSkill}
                />
              </Card>
            ) : null}
          </EditorColumn>
        </Columns>
      ) : null}
    </>
  )
}
