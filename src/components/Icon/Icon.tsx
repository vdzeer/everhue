import type { ReactNode } from 'react'

import { Svg } from './styled'
import type { IconName, IconSize } from './types'

const filled = (d: string) => <path d={d} fill="currentColor" stroke="none" />

// 24×24, drawn with a 2px round stroke unless a shape is filled.
const SHAPES: Record<IconName, ReactNode> = {
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  plan: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  hero: <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" />,
  settings: (
    <>
      <path d="M4 8h9M19 8h1M4 16h1M11 16h9" />
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="8" cy="16" r="2.5" />
    </>
  ),
  book: (
    <path d="M4 5.5c2.5-1 5.5-.8 8 1 2.5-1.8 5.5-2 8-1v13c-2.5-1-5.5-.8-8 1-2.5-1.8-5.5-2-8-1zM12 6.5v13" />
  ),
  dumbbell: <path d="M3 9v6M6 6.5v11M18 6.5v11M21 9v6M6 12h12" />,
  bubble: (
    <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4.5 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
  ),
  code: <path d="M8.5 7 4 12l4.5 5M15.5 7l4.5 5-4.5 5" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5v7M9.8 10.2h3.4M9.8 13.8h3.4" />
    </>
  ),
  play: filled('M8 5.5v13l11-6.5z'),
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth="3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  flame: filled(
    'M12 2.5c1 3.5 5.5 5.8 5.5 10.7a5.5 5.5 0 0 1-11 0c0-2.2 1-3.9 2.2-5 .3 1.8 1 2.8 2.1 3.3.3-3.2-.2-5.8 1.2-9z',
  ),
  undo: <path d="M9 7 4.5 11.5 9 16M5 11.5h9a5 5 0 0 1 0 10h-2" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  goal: <path d="M6 21V4h11l-2.5 4 2.5 4H6" />,
  history: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5M4.5 4.5v3.5H8" />
      <path d="M12 8v4l2.5 2" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7M10 11v5M14 11v5" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  steps: (
    <path d="M4 6.5 5.5 8 8 5.5M4 12.5 5.5 14 8 11.5M4 18.5 5.5 20 8 17.5M12 7h8M12 13h8M12 19h8" />
  ),
  level: <path d="M4 17l5-5 4 3 7-8M15 7h5v5" />,
  snow: (
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
  ),
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

type Props = {
  name: IconName
  size?: IconSize
  /** Give a label only when the icon stands alone; otherwise it is decoration. */
  label?: string
}

export const Icon = ({ name, size = 'md', label }: Props) => (
  <Svg
    $size={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}>
    {SHAPES[name]}
  </Svg>
)
