import { useTheme } from 'styled-components'

import { COLUMNS, ROWS, SHAPES } from './shapes'

type Props = {
  /** Screen pixels per sprite pixel. */
  scale: number
  label?: string
}

/**
 * The hero: a 12×16 pixel figure and the only pixel art in the interface.
 * Each path is one paint, drawn as runs of whole pixels.
 */
export const HeroSprite = ({ scale, label }: Props) => {
  const { sprite } = useTheme()

  return (
    <svg
      width={COLUMNS * scale}
      height={ROWS * scale}
      viewBox={`0 0 ${COLUMNS} ${ROWS}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}>
      {SHAPES.map(({ paint, rects }) => (
        <path
          key={paint}
          fill={sprite[paint]}
          d={rects
            .map(
              ([x, y, width, height]) =>
                `M${x} ${y}h${width}v${height}h-${width}z`,
            )
            .join(' ')}
        />
      ))}
    </svg>
  )
}
