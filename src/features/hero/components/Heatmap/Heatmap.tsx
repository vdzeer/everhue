import { Stack, Text } from '~/components'
import type { HeatCell, HeatLevel } from '~/core'
import { useT } from '~/services/i18n'

import { Cell, Grid, Legend, Scroll, Swatch } from './styled'

const LEVELS: HeatLevel[] = [0, 1, 2, 3]

type Props = {
  weeks: HeatCell[][]
}

export const Heatmap = ({ weeks }: Props) => {
  const t = useT()

  return (
    <Stack $gap="sm">
      <Scroll>
        <Grid role="img" aria-label={t('heat_label')}>
          {weeks.flat().map(cell => (
            <Cell key={cell.day} $level={cell.level} $future={cell.future} />
          ))}
        </Grid>
      </Scroll>
      <Legend>
        <Text variant="caption" tone="muted">
          {t('heat_less')}
        </Text>
        {LEVELS.map(level => (
          <Swatch key={level} $level={level} />
        ))}
        <Text variant="caption" tone="muted">
          {t('heat_more')}
        </Text>
      </Legend>
    </Stack>
  )
}
