// Draws the app icons from the same pixel list and the same colours the
// interface uses, so the icon cannot drift from the hero on screen.
//
//   npm run icons
//
// Plain Node, no image library: a PNG is a zlib stream with a few headers.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync } from 'node:zlib'

import { COLUMNS, ROWS, SHAPES } from '../src/components/HeroSprite/shapes.ts'
import { palettes, sprite } from '../src/themes/tokens.ts'

// The icon is always the light scene: a launcher shows it on any wallpaper.
const { colors } = palettes.light

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * `scale` is screen pixels per sprite pixel; `ground` is where the coloured
 * ground starts, as a share of the height. The maskable icon keeps the hero
 * inside the middle of the square, because a launcher may crop it to a circle.
 */
const ICONS = [
  { file: 'src/app/icon.png', size: 96, scale: 4, ground: 0.8 },
  { file: 'src/app/apple-icon.png', size: 180, scale: 7, ground: 0.78 },
  { file: 'public/icons/icon-192.png', size: 192, scale: 8, ground: 0.8 },
  { file: 'public/icons/icon-512.png', size: 512, scale: 20, ground: 0.78 },
  { file: 'public/icons/maskable-512.png', size: 512, scale: 14, ground: 0.7 },
]

const rgb = hex => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16))

const paint = ({ size, scale, ground }) => {
  const pixels = Buffer.alloc(size * size * 3)

  const fill = (left, top, width, height, hex) => {
    const colour = rgb(hex)
    Array.from({ length: height }, (_, row) => top + row).forEach(y => {
      Array.from({ length: width }, (_, column) => left + column).forEach(x => {
        pixels.set(colour, (y * size + x) * 3)
      })
    })
  }

  const groundTop = Math.round(size * ground)
  const left = Math.round((size - COLUMNS * scale) / 2)
  const top = groundTop - ROWS * scale

  // A pale sky, a ground the colour of earned XP, and the hero standing on it.
  fill(0, 0, size, groundTop, colors.background)
  fill(0, groundTop, size, size - groundTop, colors.accent)
  SHAPES.forEach(shape => {
    shape.rects.forEach(([x, y, width, height]) => {
      fill(
        left + x * scale,
        top + y * scale,
        width * scale,
        height * scale,
        sprite[shape.paint],
      )
    })
  })

  return pixels
}

const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, checksum])
}

const encodePng = (pixels, size) => {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header.writeUInt8(8, 8) // bits per channel
  header.writeUInt8(2, 9) // truecolour, no alpha: iOS wants an opaque icon
  // Every row starts with a filter byte; 0 means "stored as is".
  const rows = Buffer.concat(
    Array.from({ length: size }, (_, y) =>
      Buffer.concat([
        Buffer.from([0]),
        pixels.subarray(y * size * 3, (y + 1) * size * 3),
      ]),
    ),
  )

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

ICONS.forEach(icon => {
  const target = resolve(root, icon.file)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, encodePng(paint(icon), icon.size))
  process.stdout.write(`${icon.file}  ${icon.size}×${icon.size}\n`)
})
