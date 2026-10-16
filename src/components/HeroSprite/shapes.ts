import type { sprite } from '~/themes'

export const COLUMNS = 12
export const ROWS = 16

type Paint = keyof typeof sprite
/** A run of whole pixels: x, y, width, height. */
type Rect = readonly [number, number, number, number]

/**
 * The hero, one paint per entry; later entries are drawn over earlier ones.
 * The component and the app icons (`npm run icons`) both draw from this list.
 */
export const SHAPES: readonly { paint: Paint; rects: readonly Rect[] }[] = [
  {
    paint: 'hair',
    rects: [
      [4, 0, 4, 1],
      [3, 1, 6, 2],
      [3, 3, 1, 1],
      [8, 3, 1, 1],
    ],
  },
  {
    paint: 'skin',
    rects: [
      [4, 3, 4, 1],
      [3, 4, 6, 2],
      [4, 6, 4, 1],
      [1, 9, 1, 2],
      [10, 9, 1, 2],
    ],
  },
  {
    paint: 'ink',
    rects: [
      [4, 4, 1, 1],
      [7, 4, 1, 1],
      [2, 10, 8, 1],
    ],
  },
  {
    paint: 'tunic',
    rects: [
      [2, 7, 8, 1],
      [1, 8, 10, 1],
      [2, 9, 8, 1],
      [2, 11, 8, 1],
    ],
  },
  {
    paint: 'scarf',
    rects: [
      [3, 7, 6, 1],
      [8, 8, 1, 2],
      [5, 10, 2, 1],
    ],
  },
  {
    paint: 'legs',
    rects: [
      [3, 12, 6, 1],
      [3, 13, 2, 2],
      [7, 13, 2, 2],
    ],
  },
  {
    paint: 'boots',
    rects: [
      [2, 15, 3, 1],
      [7, 15, 3, 1],
    ],
  },
]
