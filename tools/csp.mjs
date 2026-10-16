// Gives every exported page its own Content Security Policy. Runs after
// `next build` (see the `build` script):
//
//   node tools/csp.mjs [out]
//
// The static export carries inline scripts (the theme script and React's
// payload) that differ from page to page, and Firebase Hosting sends one
// header to all of them. So each page gets a <meta> policy that allows its
// own inline scripts by their sha256 hashes and nothing else inline. A
// <meta> policy cannot hold `frame-ancestors`; that one stays in the header
// in firebase.json, and the browser enforces both.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { parseEnv } from 'node:util'

// Next's order for a production build: the process environment wins, then
// the first of these files that sets the key.
const ENV_FILES = [
  '.env.production.local',
  '.env.local',
  '.env.production',
  '.env',
]

const loadEnv = dir => {
  const fromFiles = ENV_FILES.map(name => join(dir, name))
    .filter(existsSync)
    .reverse()
    .reduce(
      (env, file) => ({ ...env, ...parseEnv(readFileSync(file, 'utf8')) }),
      {},
    )
  return { ...fromFiles, ...process.env }
}

// The same hosts and ports as `src/services/firebase.ts`.
const EMULATOR_AUTH = 'http://127.0.0.1:9099'
const EMULATOR_FIRESTORE = 'http://127.0.0.1:8080'

/** What the page talks to, given the build's NEXT_PUBLIC_* settings. */
const policyFor = (env, scriptHashes) => {
  const emulators = env.NEXT_PUBLIC_USE_EMULATORS === '1'
  const appCheck = Boolean(env.NEXT_PUBLIC_APPCHECK_SITE_KEY) && !emulators
  const authDomain = env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      ...scriptHashes,
      // Google sign-in loads its iframe helper from here.
      'https://apis.google.com',
      ...(appCheck
        ? [
            'https://www.google.com/recaptcha/',
            'https://www.gstatic.com/recaptcha/',
          ]
        : []),
    ],
    // styled-components writes its rules at runtime.
    'style-src': ["'self'", "'unsafe-inline'"],
    // Firestore's WebChannel loads this image to test the network when its
    // connection drops.
    'img-src': [
      "'self'",
      'data:',
      'https://www.google.com/images/cleardot.gif',
    ],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      'https://firestore.googleapis.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      // App Check trades a reCAPTCHA answer, fetched by reCAPTCHA's own
      // script, for its token.
      ...(appCheck
        ? [
            'https://content-firebaseappcheck.googleapis.com',
            'https://www.google.com/recaptcha/',
          ]
        : []),
      ...(emulators ? [EMULATOR_AUTH, EMULATOR_FIRESTORE] : []),
    ],
    // The sign-in popup talks to the page through an iframe on authDomain.
    'frame-src': [
      ...(authDomain ? [`https://${authDomain}`] : []),
      ...(emulators ? [EMULATOR_AUTH] : []),
      ...(appCheck
        ? [
            'https://www.google.com/recaptcha/',
            'https://recaptcha.google.com/recaptcha/',
          ]
        : []),
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }

  return Object.entries(directives)
    .map(
      ([name, sources]) =>
        `${name} ${sources.length > 0 ? sources.join(' ') : "'none'"}`,
    )
    .join('; ')
}

const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g
const CSP_META = /<meta http-equiv="Content-Security-Policy"[^>]*>/

/** The hash a browser computes for each inline script on the page. */
const inlineScriptHashes = html =>
  [...html.matchAll(INLINE_SCRIPT)]
    .filter(([, attributes]) => !/\bsrc=/.test(attributes))
    // The HTML parser turns CRLF into LF before the browser hashes the text.
    .map(([, , text]) => text.replace(/\r\n?/g, '\n'))
    .map(
      text =>
        `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`,
    )
    .filter((hash, index, all) => all.indexOf(hash) === index)

/** The page with its policy as the first thing in <head> after the charset. */
const withPolicy = (html, env) => {
  const bare = html.replace(CSP_META, '')
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policyFor(
    env,
    inlineScriptHashes(bare),
  )}"/>`
  const charset = bare.match(/<meta charSet="utf-8"\/>|<meta charset="utf-8">/i)
  const anchor = charset ?? bare.match(/<head[^>]*>/i)
  if (!anchor) throw new Error('no <head> to put the policy in')

  const at = anchor.index + anchor[0].length
  const result = bare.slice(0, at) + meta + bare.slice(at)
  // A policy only covers what comes after it.
  const firstScript = result.search(/<script\b/)
  if (firstScript !== -1 && firstScript < result.indexOf(meta)) {
    throw new Error('a script comes before the policy')
  }
  return result
}

const htmlFiles = dir =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(path)
    return entry.name.endsWith('.html') ? [path] : []
  })

const main = () => {
  const root = process.cwd()
  const outDir = resolve(root, process.argv[2] ?? 'out')
  const env = loadEnv(root)
  const pages = htmlFiles(outDir)
  if (pages.length === 0) throw new Error(`no pages in ${outDir}`)

  pages.forEach(page => {
    writeFileSync(page, withPolicy(readFileSync(page, 'utf8'), env))
  })
  process.stdout.write(
    `csp: a policy on ${pages.length} pages in ${relative(root, outDir) || '.'}\n`,
  )
}

main()
