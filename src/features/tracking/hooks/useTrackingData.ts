import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useCallback, useMemo } from 'react'

import {
  contributionLogs,
  type Activity,
  type Goal,
  type GoalEntry,
  type Log,
  type Skill,
} from '~/core'
import { getFirebase } from '~/services/firebase'
import {
  activityFromDoc,
  goalEntryFromDoc,
  goalFromDoc,
  logFromDoc,
  skillFromDoc,
} from '~/services/firestoreMappers'
import { queryLoadState, type LoadState } from '~/services/queryState'
import { useUid } from '~/store'

export const COLLECTIONS = {
  skills: 'skills',
  activities: 'activities',
  logs: 'logs',
  goals: 'goals',
  goalEntries: 'goal_entries',
} as const

export type CollectionName = keyof typeof COLLECTIONS

/** Query keys carry the uid, so one account never reads another's cache. */
export const trackingKey = (name: CollectionName, uid: string | null) =>
  [name, uid] as const

type Mapper<Model> = (
  id: string,
  data: Record<string, unknown>,
  now: number,
) => Model | null

/**
 * The owner-scoped list read. The `where` clause is not an optimisation: the
 * security rules refuse a list that does not carry it.
 */
const fetchOwned = async <Model>(
  name: CollectionName,
  uid: string,
  fromDoc: Mapper<Model>,
): Promise<Model[]> => {
  const { db } = getFirebase()
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS[name]), where('owner_uid', '==', uid)),
  )
  const now = Date.now()

  return snapshot.docs
    .map(document =>
      // A write that has not reached the server yet has no timestamp; the
      // estimate keeps it in the list instead of sorting it to 1970.
      fromDoc(
        document.id,
        document.data({ serverTimestamps: 'estimate' }),
        now,
      ),
    )
    .filter((model): model is Model => model !== null)
}

const useOwned = <Model>(name: CollectionName, fromDoc: Mapper<Model>) => {
  const uid = useUid()

  return useQuery({
    queryKey: trackingKey(name, uid),
    queryFn: () => fetchOwned(name, uid as string, fromDoc),
    // Waits for a known, signed-in user: an early run would be refused.
    enabled: uid !== null,
    // The cache is updated by hand on every write, so a refetch on focus
    // would only spend reads.
    staleTime: Infinity,
  })
}

const EMPTY_SKILLS: Skill[] = []
const EMPTY_ACTIVITIES: Activity[] = []
const EMPTY_LOGS: Log[] = []
const EMPTY_GOALS: Goal[] = []
const EMPTY_ENTRIES: GoalEntry[] = []

export type TrackingData = {
  state: LoadState
  skills: Skill[]
  activities: Activity[]
  /** What was logged against activities. Quests and goals count these. */
  logs: Log[]
  goals: Goal[]
  entries: GoalEntry[]
  /**
   * `logs` plus one stand-in per day of contributions to a goal that trains
   * a skill. XP, levels, streaks and the activity map are computed from these.
   */
  xpLogs: Log[]
  retry: () => void
}

/** Everything the signed-in user has stored, with one load state. */
export const useTrackingData = (): TrackingData => {
  const queryClient = useQueryClient()
  const skills = useOwned<Skill>('skills', skillFromDoc)
  const activities = useOwned<Activity>('activities', activityFromDoc)
  const logs = useOwned<Log>('logs', logFromDoc)
  const goals = useOwned<Goal>('goals', goalFromDoc)
  const entries = useOwned<GoalEntry>('goalEntries', goalEntryFromDoc)

  const retry = useCallback(() => {
    queryClient.invalidateQueries()
  }, [queryClient])

  const logList = logs.data ?? EMPTY_LOGS
  const goalList = goals.data ?? EMPTY_GOALS
  const entryList = entries.data ?? EMPTY_ENTRIES

  const xpLogs = useMemo(
    () => [...logList, ...contributionLogs(goalList, entryList)],
    [logList, goalList, entryList],
  )

  return {
    state: queryLoadState([skills, activities, logs, goals, entries]),
    skills: skills.data ?? EMPTY_SKILLS,
    activities: activities.data ?? EMPTY_ACTIVITIES,
    logs: logList,
    goals: goalList,
    entries: entryList,
    xpLogs,
    retry,
  }
}
