import { Button, Card, Row, Stack, Text } from '~/components'
import type { WeekDayEffort } from '~/core'
import { WEEKDAY_KEYS, durationLabel } from '~/features/tracking/services'
import { useT } from '~/services/i18n'

import { Bar, Column, Day, Days } from './styled'

/** A bar is full at an hour, so a 10-minute day still shows as a sliver. */
const FULL_BAR_MINUTES = 60

type Props = {
  week: WeekDayEffort[]
  /** "This week" unless the card shows another one. */
  title?: string
  /** Where "Review" leads; the link is left out on the review itself. */
  reviewHref?: string
}

export const WeekCard = ({ week, title, reviewHref }: Props) => {
  const t = useT()
  const total = week.reduce((sum, day) => sum + day.minutes, 0)
  const scale = Math.max(FULL_BAR_MINUTES, ...week.map(day => day.minutes))
  const heading = title ?? t('week_title')

  return (
    <Card aria-label={heading}>
      <Stack>
        <Row $justify="space-between" $align="baseline">
          <Text as="h2" variant="subtitle">
            {heading}
          </Text>
          <Text variant="secondary" tone="muted">
            {durationLabel(total, t)}
          </Text>
        </Row>
        <Days>
          {week.map((day, index) => (
            <Day key={day.day}>
              <Column>
                <Bar $ratio={day.minutes / scale} />
              </Column>
              <Text
                variant={day.isToday ? 'label' : 'caption'}
                tone={day.isToday ? 'default' : 'muted'}>
                {t(WEEKDAY_KEYS[index])}
              </Text>
            </Day>
          ))}
        </Days>
        {reviewHref ? (
          <Row>
            <Button href={reviewHref}>{t('review_open')}</Button>
          </Row>
        ) : null}
      </Stack>
    </Card>
  )
}
