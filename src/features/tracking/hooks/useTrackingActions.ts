import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useMemo } from 'react'

import {
  dayKey,
  effortFor,
  type Activity,
  type DayKey,
  type Goal,
  type GoalEntry,
  type Log,
  type LogSource,
  type Skill,
} from '~/core'
import { getFirebase } from '~/services/firebase'
import {
  activityToDoc,
  goalEntryToDoc,
  goalToDoc,
  logToDoc,
  skillToDoc,
} from '~/services/firestoreMappers'
import { useSyncStore, useUid } from '~/store'

import {
  COLLECTIONS,
  trackingKey,
  type CollectionName,
} from './useTrackingData'

type WithId = { id: string }

const upsert = <Model extends WithId>(
  queryClient: QueryClient,
  name: CollectionName,
  uid: string,
  model: Model,
) =>
  queryClient.setQueryData<Model[]>(trackingKey(name, uid), (current = []) =>
    current.some(item => item.id === model.id)
      ? current.map(item => (item.id === model.id ? model : item))
      : [...current, model],
  )

const remove = (
  queryClient: QueryClient,
  name: CollectionName,
  uid: string,
  id: string,
) =>
  queryClient.setQueryData<WithId[]>(trackingKey(name, uid), (current = []) =>
    current.filter(item => item.id !== id),
  )

/**
 * A Firestore write resolves only when the server has it, which offline means
 * "not for a long time". So writes are sent and not awaited: the local cache
 * already has the change, and a refusal is reported through the sync store.
 */
const send = (write: Promise<unknown>) => {
  write.catch((error: unknown) => {
    console.error(error)
    useSyncStore.getState().markFailed()
  })
}

export type SkillInput = Pick<Skill, 'name' | 'realm'>
export type ActivityInput = Omit<
  Activity,
  'id' | 'ownerUid' | 'archived' | 'createdAt'
>
export type LogInput = {
  activity: Activity
  value: number
  source: LogSource
  partId: string
  /** The day it was done; today when left out. */
  day?: DayKey
}
export type GoalInput = Omit<Goal, 'id' | 'ownerUid' | 'archived' | 'createdAt'>
export type EntryInput = {
  goal: Goal
  /** Positive puts money in, negative takes it out. */
  amount: number
  day: DayKey
}

export const newId = (name: CollectionName) =>
  doc(collection(getFirebase().db, COLLECTIONS[name])).id

/**
 * Every write the app makes. Each one updates the query cache first, so the
 * screen changes at once, and then sends the document.
 */
export const useTrackingActions = () => {
  const queryClient = useQueryClient()
  const uid = useUid()

  return useMemo(() => {
    const ref = (name: CollectionName, id: string) =>
      doc(getFirebase().db, COLLECTIONS[name], id)

    /**
     * A new document takes the server's clock as `created_at`. An edit sends
     * every other field and leaves the stored `created_at` alone: the rules
     * accept nothing else, so a client cannot backdate a document.
     */
    const write = (
      name: CollectionName,
      id: string,
      fields: Record<string, unknown>,
      isNew: boolean,
    ) =>
      send(
        isNew
          ? setDoc(ref(name, id), { ...fields, created_at: serverTimestamp() })
          : updateDoc(ref(name, id), fields),
      )

    const putSkill = (skill: Skill, existing?: Skill) => {
      upsert(queryClient, 'skills', skill.ownerUid, skill)
      write('skills', skill.id, skillToDoc(skill), !existing)
    }

    const putActivity = (activity: Activity, existing?: Activity) => {
      upsert(queryClient, 'activities', activity.ownerUid, activity)
      write('activities', activity.id, activityToDoc(activity), !existing)
    }

    const putGoal = (goal: Goal, existing?: Goal) => {
      upsert(queryClient, 'goals', goal.ownerUid, goal)
      write('goals', goal.id, goalToDoc(goal), !existing)
    }

    const removeEntry = (ownerUid: string, entryId: string) => {
      remove(queryClient, 'goalEntries', ownerUid, entryId)
      send(deleteDoc(ref('goalEntries', entryId)))
    }

    return {
      saveSkill: (input: SkillInput, existing?: Skill) => {
        if (!uid) return
        putSkill(
          existing
            ? { ...existing, ...input }
            : {
                id: newId('skills'),
                ownerUid: uid,
                archived: false,
                createdAt: Date.now(),
                ...input,
              },
          existing,
        )
      },

      deleteSkill: (skill: Skill) => {
        remove(queryClient, 'skills', skill.ownerUid, skill.id)
        send(deleteDoc(ref('skills', skill.id)))
      },

      saveActivity: (input: ActivityInput, existing?: Activity) => {
        if (!uid) return
        putActivity(
          existing
            ? { ...existing, ...input }
            : {
                id: newId('activities'),
                ownerUid: uid,
                archived: false,
                createdAt: Date.now(),
                ...input,
              },
          existing,
        )
      },

      /** Its logs stay: what was done keeps counting towards the skill. */
      deleteActivity: (activity: Activity) => {
        remove(queryClient, 'activities', activity.ownerUid, activity.id)
        send(deleteDoc(ref('activities', activity.id)))
      },

      addLog: ({ activity, value, source, partId, day }: LogInput) => {
        if (!uid || value <= 0) return
        const now = Date.now()
        const log: Log = {
          id: newId('logs'),
          ownerUid: uid,
          activityId: activity.id,
          skillId: activity.skillId,
          day: day ?? dayKey(new Date(now)),
          kind: activity.kind,
          value,
          effortMinutes: effortFor(activity, value),
          source,
          partId,
          createdAt: now,
        }
        upsert(queryClient, 'logs', uid, log)
        write('logs', log.id, logToDoc(log), true)
      },

      deleteLog: (logId: string) => {
        if (!uid) return
        remove(queryClient, 'logs', uid, logId)
        send(deleteDoc(ref('logs', logId)))
      },

      addMany: (skills: Skill[], activities: Activity[]) => {
        skills.forEach(skill => putSkill(skill))
        activities.forEach(activity => putActivity(activity))
      },

      saveGoal: (input: GoalInput, existing?: Goal) => {
        if (!uid) return
        putGoal(
          existing
            ? { ...existing, ...input }
            : {
                id: newId('goals'),
                ownerUid: uid,
                archived: false,
                createdAt: Date.now(),
                ...input,
              },
          existing,
        )
      },

      toggleGoalStep: (goal: Goal, stepId: string) =>
        putGoal(
          {
            ...goal,
            steps: goal.steps.map(step =>
              step.id === stepId ? { ...step, done: !step.done } : step,
            ),
          },
          goal,
        ),

      setGoalArchived: (goal: Goal, archived: boolean) =>
        putGoal({ ...goal, archived }, goal),

      /**
       * Unlike an activity, a goal takes its entries with it: a contribution
       * to a goal that no longer exists would be money counted nowhere.
       */
      deleteGoal: (goal: Goal) => {
        const entries =
          queryClient.getQueryData<GoalEntry[]>(
            trackingKey('goalEntries', goal.ownerUid),
          ) ?? []
        entries
          .filter(entry => entry.goalId === goal.id)
          .forEach(entry => removeEntry(goal.ownerUid, entry.id))
        remove(queryClient, 'goals', goal.ownerUid, goal.id)
        send(deleteDoc(ref('goals', goal.id)))
      },

      addEntry: ({ goal, amount, day }: EntryInput) => {
        if (!uid || !Number.isFinite(amount) || amount === 0) return
        const entry: GoalEntry = {
          id: newId('goalEntries'),
          ownerUid: uid,
          goalId: goal.id,
          amount,
          day,
          createdAt: Date.now(),
        }
        upsert(queryClient, 'goalEntries', uid, entry)
        write('goalEntries', entry.id, goalEntryToDoc(entry), true)
      },

      deleteEntry: (entryId: string) => {
        if (!uid) return
        removeEntry(uid, entryId)
      },
    }
  }, [queryClient, uid])
}

export type TrackingActions = ReturnType<typeof useTrackingActions>
