# Everhue

Everhue is a web app that turns everyday activities into a small game. You
plan the things you want to do (read, train, learn a language), log them with a
timer or by hand, and each minute becomes XP for a skill and for your hero.
Goals, streaks and a weekly review sit on top of the same logs. It runs as a
static site on Firebase Hosting with Google sign-in and Cloud Firestore, and
needs no server code. The UI is in English and Ukrainian.

The author's instance runs at https://everhue.web.app. This repository is set
up so that you can run your own copy on your own Firebase project.

## Features

- Google sign-in, sign-out, and account deletion that erases all stored data.
  Signing out or deleting the account also deletes the offline cache from the
  browser.
- Skills in six kinds (reading and study, sport, languages, code and creative
  work, calm and sleep, money and career).
- Activities counted as time, as an amount (pages, km, reps) or as yes or no,
  with a daily target, up to eight parts and a schedule: every day, chosen
  weekdays, or a number of times a week.
- A Today screen with the day's quests, manual logging, undo, and logging for
  past days.
- A timer that survives a page reload and gives 20% more XP than a manual
  entry.
- Hero and skill levels, a day streak with streak freezes, a 30-day
  consistency figure and a 26-week activity map.
- Goals of four kinds: a total of logged activity, a skill level, a checklist
  of steps, and savings with contributions, withdrawals, a deadline and a
  monthly plan.
- History of every log, and a week-in-review page compared with the week
  before.
- Export of all data as JSON and of the logs as CSV.
- Light and dark themes, a phone layout, and a web manifest for adding the app
  to a home screen.
- Writes do not wait for the network: the Firestore cache keeps them across a
  reload and sends them when the connection is back. Signing out waits a few
  seconds for them to reach the server; anything still unsent after that is
  deleted with the cache.

XP, levels, streaks and goal progress are never stored. They are computed in
the browser from the raw logs (`src/core`), so the formulas can change without
a data migration. The formulas live in `src/core` and its tests.

## Stack

- Next.js 16 with `output: 'export'` (static HTML, no server), React 19,
  TypeScript
- styled-components, TanStack Query, zustand, Formik and Yup, i18next
- Firebase Authentication (Google provider), Cloud Firestore, Firebase Hosting;
  everything fits the free Spark plan
- Jest for the app; `@firebase/rules-unit-testing` against the Firestore
  emulator for the security rules
- ESLint with Prettier, Husky and lint-staged

## Requirements

- Node.js 22 or newer, npm
- Java 21 or newer, for the Firebase emulators and the rules tests only.
  `firebase-tools` 15 does not start the Firestore emulator on older Java.
- A Google account and a Firebase project, only to deploy your own copy

The Firebase CLI is a dev dependency of `rules-tests/`, so no global install is
needed. The commands below write it as `firebase`; either install
`firebase-tools` globally or use `rules-tests/node_modules/.bin/firebase` in its
place.

## Install

```sh
git clone <your fork URL> everhue
cd everhue
npm ci
npm --prefix rules-tests ci
```

The repository has two npm workspaces with separate lockfiles: the app in the
root and the rules tests in `rules-tests/`.

## Run locally on the emulators

No Firebase project is needed for this. Create `.env` from the template and
point it at a `demo-` project, which the emulators accept without credentials
and which cannot reach any real Google Cloud project:

```sh
cp .env.example .env
```

```sh
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-everhue.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-everhue
NEXT_PUBLIC_FIREBASE_APP_ID=demo-app-id
NEXT_PUBLIC_USE_EMULATORS=1
```

The project id must stay `demo-everhue`: the `emulators` script starts the
emulators under that id. Then, in two terminals:

```sh
npm run emulators   # Auth on 9099, Firestore on 8080
npm run dev         # http://localhost:3000
```

With `NEXT_PUBLIC_USE_EMULATORS=1` the sign-in screen has a "Sign in as a test
user" button (anonymous sign-in against the Auth emulator). A build for a real
project never shows it. Emulator data is gone when the emulators stop.

Without a `.env` file the app still builds and the tests still pass, but the
page cannot start Firebase in the browser and fails with `auth/invalid-api-key`.

## Deploy your own copy

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
   The Spark plan is enough.
2. In Project settings, under Your apps, add a Web app.
3. Create `.env.production` from `.env.example` and fill in the web app's
   `apiKey`, `authDomain`, `projectId` and `appId`, with
   `NEXT_PUBLIC_USE_EMULATORS=0`. These values are public identifiers that end
   up in the shipped JavaScript, not secrets. The file is git-ignored all the
   same, so each copy keeps its own.
4. In Authentication, open Sign-in method and enable Google. `localhost`,
   `<project-id>.web.app` and `<project-id>.firebaseapp.com` are allowed by
   default; a custom domain has to be added in the Authentication settings,
   under Authorized domains.
5. Pick the Firestore location. `firebase.json` creates the `(default)`
   database in `eur3` (Europe multi-region). Change `firestore.location`
   before the first deploy if you want another one; the location cannot be
   changed later. If you create the database in the console instead, use the
   same location as `firebase.json`.
6. Point the CLI at your project. `.firebaserc` names the author's project
   (`everhue`), which your account cannot deploy to:

   ```sh
   firebase login
   firebase use --add   # pick your project, give it the alias "default"
   ```

7. Deploy the security rules (this also creates the database if it does not
   exist yet), then build and deploy the site:

   ```sh
   firebase deploy --only firestore
   npm run build        # static export to out/, reads .env.production
   firebase deploy --only hosting
   ```

The site is then at `https://<project-id>.web.app`. If the CLI reports that
the project has no Hosting site, open Hosting in the console once, click Get
started, and deploy again.

### Optional: deploy from GitHub Actions

The `deploy` job in `.github/workflows/ci.yml` deploys the site and then the
rules after the checks pass on `main`. It stores no key: GitHub's OIDC token is
exchanged for short-lived credentials of a deploy service account through
Workload Identity Federation, and only `main` of your repository, in the
`production` environment, can get them. Until the variables below are set the
job is skipped.

One-time setup with the Google Cloud CLI (`PROJECT` is your project id,
`REPO_ID` the numeric id of your GitHub repository, from
`https://api.github.com/repos/<owner>/<repo>`):

```sh
PROJECT=<project-id>
REPO_ID=<repository id>
SA=github-deploy@$PROJECT.iam.gserviceaccount.com
NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')

gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --project $PROJECT
gcloud iam service-accounts create github-deploy --display-name="GitHub Actions deploy" --project $PROJECT
for role in roles/firebasehosting.admin roles/firebaserules.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=$role --condition=None
done
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions" --project $PROJECT
gcloud iam workload-identity-pools providers create-oidc main-deploy --location=global \
  --workload-identity-pool=github --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id" \
  --attribute-condition="assertion.repository_id == '$REPO_ID' && assertion.ref == 'refs/heads/main' && assertion.environment == 'production'" \
  --project $PROJECT
gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUMBER/locations/global/workloadIdentityPools/github/attribute.repository_id/$REPO_ID" \
  --project $PROJECT
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/$NUMBER/locations/global/workloadIdentityPools/github/providers/main-deploy"
echo "GCP_SERVICE_ACCOUNT=$SA"
```

Then, in the repository's Settings → Secrets and variables → Actions →
Variables, add `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT` (the
two lines printed above), `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` and
`FIREBASE_APP_ID` (from `firebase apps:sdkconfig WEB`). These are public
identifiers, not secrets. `APPCHECK_SITE_KEY` is optional, as in
`.env.example`. Settings → Environments → `production` can also require your
approval before each deploy.

### Content Security Policy

`npm run build` ends with `tools/csp.mjs`, which writes a Content Security
Policy into every exported page as a `<meta>` tag. It allows that page's own
inline scripts by their hashes, Firebase Auth, Firestore and Google sign-in
(including the `authDomain` from the env file), and App Check when it is
configured. `frame-ancestors 'none'` cannot be set from a `<meta>` tag, so
`firebase.json` sends it as a header. If you add a Firebase service or another
host the browser has to reach, add it in `tools/csp.mjs`, or the browser will
block it.

### App Check (optional)

[App Check](https://firebase.google.com/docs/app-check) makes Firebase refuse
requests that do not come from your site. The app supports it with the
reCAPTCHA Enterprise provider and leaves it off unless a site key is set:

1. In the Google Cloud console for the same project, open reCAPTCHA (under
   Fraud Defense), enable the API if asked, and create a Web key for your
   domains (`<project-id>.web.app`,
   `<project-id>.firebaseapp.com` and any custom domain). Leave out
   `localhost`, and leave the checkbox challenge off.
2. In the Firebase console, open App Check, Apps, and register the web app
   with the reCAPTCHA Enterprise provider and that key.
3. Put the key in `.env.production` as `NEXT_PUBLIC_APPCHECK_SITE_KEY`, then
   build and deploy the site.
4. Watch the App Check metrics in the console for a few days. Once almost all
   requests are verified, turn on enforcement for Cloud Firestore and
   Authentication there. Until then nothing is refused.

With `NEXT_PUBLIC_USE_EMULATORS=1` App Check is never started.

## Tests and checks

| Command | What it checks |
|---|---|
| `npm run lint` | `tsc --noEmit` and `eslint .` |
| `npm test` | Jest: game logic in `src/core`, services, and source scans for raw colours and sizes, hard-coded strings, colour contrast and locale key parity |
| `npm run test:rules` | Firestore security rules on the emulator, under the `demo-everhue` project; needs Java 21 or newer |
| `npm run build` | the static export in `out/` with a Content Security Policy on every page; fetches the Google Fonts at build time |

`npm run lint`, `npm test` and `npm run build` need no `.env` file and no
network access to Firebase. The rules tests check that a user can read, list,
create, change and delete only their own documents, that `owner_uid` cannot be
changed, that document shapes are closed down to every list element, that
`created_at` is the server's time and never changes, and that logs and goal
contributions cannot be edited in place.

If the default Java is older than 21, put a JDK 21 first in `PATH` for these
commands, for example with Homebrew on macOS:

```sh
PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run test:rules
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests and the build in
one job and the rules tests in another.

## Project layout

```
src/
  app/          Next.js routes; each page renders one feature screen
  core/         game logic as pure TypeScript: days, XP, levels, streaks, quests, goals
  features/     one folder per feature: screens, components, hooks, services
  components/   shared UI components
  services/     Firebase client, Firestore document mappers, i18n (en.json, uk.json)
  store/        zustand stores: auth, settings, timer, sync state
  themes/       design tokens, light and dark palettes, global styles
  hooks/, types/
rules-tests/    Firestore rules tests, its own npm workspace
tools/          make-icons.mjs draws the app icons from the hero sprite;
                csp.mjs adds the Content Security Policy to the built pages
firestore.rules, firestore.indexes.json, firebase.json
```

## Licence

MIT, see [LICENSE](./LICENSE).

The Unbounded and Onest typefaces are licensed under the SIL Open Font
License 1.1. They are not stored in this repository: `next/font` downloads them
from Google Fonts at build time and serves them with the site. The app icons,
the interface icons and the hero sprite are drawn in this repository's code.
