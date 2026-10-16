import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// `tools/csp.mjs` runs after `next build` and gives each exported page a
// policy for its own inline scripts. These tests run it on two small pages.

const SCRIPT = join(__dirname, '..', '..', 'tools', 'csp.mjs')

const page = (inline: string) =>
  '<!DOCTYPE html><html><head><meta charSet="utf-8"/>' +
  '<script src="/_next/static/chunks/a.js" async=""></script>' +
  `<script>${inline}</script></head><body>` +
  '<script>self.__next_f.push([1])</script>' +
  '<script>self.__next_f.push([1])</script></body></html>'

const hash = (text: string) =>
  `'sha256-${createHash('sha256').update(text).digest('base64')}'`

const ENV = {
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  NEXT_PUBLIC_USE_EMULATORS: '0',
}

/** Builds a fake `out/`, runs the script `times` times, returns the pages. */
const run = (env: Record<string, string>, times = 1) => {
  const dir = mkdtempSync(join(tmpdir(), 'everhue-csp-'))
  try {
    mkdirSync(join(dir, 'out', 'hero'), { recursive: true })
    writeFileSync(join(dir, 'out', 'index.html'), page('today()'))
    writeFileSync(join(dir, 'out', 'hero', 'index.html'), page('hero()'))
    Array.from({ length: times }).forEach(() =>
      execFileSync(process.execPath, [SCRIPT], {
        cwd: dir,
        // Only what the test sets: no NEXT_PUBLIC_* from this shell.
        env: { NODE_ENV: 'production', PATH: process.env.PATH, ...env },
      }),
    )
    return {
      today: readFileSync(join(dir, 'out', 'index.html'), 'utf8'),
      hero: readFileSync(join(dir, 'out', 'hero', 'index.html'), 'utf8'),
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const policyOf = (html: string) => {
  const metas = [
    ...html.matchAll(
      /<meta http-equiv="Content-Security-Policy" content="([^"]*)"\/>/g,
    ),
  ]
  expect(metas).toHaveLength(1)
  return Object.fromEntries(
    metas[0][1].split('; ').map(directive => {
      const [name, ...sources] = directive.split(' ')
      return [name, sources]
    }),
  ) as Record<string, string[]>
}

describe('csp', () => {
  it('puts the policy before the first script', () => {
    const { today } = run(ENV)
    const meta = today.indexOf('http-equiv="Content-Security-Policy"')

    expect(meta).toBeGreaterThan(today.indexOf('<meta charSet="utf-8"/>'))
    expect(meta).toBeLessThan(today.indexOf('<script'))
  })

  it("allows each page's own inline scripts by hash and nothing else inline", () => {
    const { today, hero } = run(ENV)
    const todayScripts = policyOf(today)['script-src']
    const heroScripts = policyOf(hero)['script-src']
    const shared = hash('self.__next_f.push([1])')

    expect(todayScripts).toEqual(
      expect.arrayContaining(["'self'", hash('today()'), shared]),
    )
    expect(todayScripts).not.toContain(hash('hero()'))
    expect(heroScripts).toEqual(
      expect.arrayContaining([hash('hero()'), shared]),
    )
    expect(todayScripts.filter(source => source === shared)).toHaveLength(1)
    expect(todayScripts).not.toContain("'unsafe-inline'")
    expect(todayScripts).not.toContain("'unsafe-eval'")
  })

  it('lets Google sign-in frame the auth domain and nothing frame the page', () => {
    const policy = policyOf(run(ENV).today)

    expect(policy['frame-src']).toEqual(['https://demo.firebaseapp.com'])
    expect(policy['script-src']).toContain('https://apis.google.com')
    expect(policy['img-src']).toContain(
      'https://www.google.com/images/cleardot.gif',
    )
    expect(policy['object-src']).toEqual(["'none'"])
    expect(policy['default-src']).toEqual(["'self'"])
    // Only a header can carry it: firebase.json sends it.
    expect(policy['frame-ancestors']).toBeUndefined()
  })

  it('opens the reCAPTCHA and App Check hosts only with a site key', () => {
    const without = policyOf(run(ENV).today)
    const withKey = policyOf(
      run({ ...ENV, NEXT_PUBLIC_APPCHECK_SITE_KEY: 'site-key' }).today,
    )

    expect(without['script-src'].join(' ')).not.toContain('recaptcha')
    expect(without['connect-src'].join(' ')).not.toContain('appcheck')
    expect(withKey['script-src']).toContain('https://www.google.com/recaptcha/')
    expect(withKey['frame-src']).toContain('https://www.google.com/recaptcha/')
    expect(withKey['connect-src']).toEqual(
      expect.arrayContaining([
        'https://content-firebaseappcheck.googleapis.com',
        'https://www.google.com/recaptcha/',
      ]),
    )
  })

  it('opens the emulators only in an emulator build, without App Check', () => {
    const real = policyOf(run(ENV).today)
    const local = policyOf(
      run({
        ...ENV,
        NEXT_PUBLIC_USE_EMULATORS: '1',
        NEXT_PUBLIC_APPCHECK_SITE_KEY: 'site-key',
      }).today,
    )

    expect(real['connect-src'].join(' ')).not.toContain('127.0.0.1')
    expect(local['connect-src']).toEqual(
      expect.arrayContaining([
        'http://127.0.0.1:9099',
        'http://127.0.0.1:8080',
      ]),
    )
    expect(local['connect-src'].join(' ')).not.toContain('appcheck')
  })

  it('replaces its own policy when it runs again', () => {
    const { today } = run(ENV, 2)

    expect(policyOf(today)['script-src']).toContain(hash('today()'))
  })
})
