import { dayKey } from '~/core'

import { useNow } from './useNow'

const MINUTE_MS = 60_000

/** Today's local date; rolls over by itself when the day changes. */
export const useToday = () => dayKey(new Date(useNow(MINUTE_MS)))
