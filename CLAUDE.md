# CLAUDE.md — HERO System Mobile (clean-room rebuild)

This is the **`rebuild` branch** of HERO System Mobile: a from-scratch, modern
React Native **0.79.2 + TypeScript** rebuild of the legacy app. Read `REBUILD_PLAN.md`
in this directory for the full architecture and phase plan.

## Worktree layout (important)

This is a git **worktree** on the orphan `rebuild` branch. The legacy app lives in a
sibling worktree on `master`:

- `/home/sentry0/apps/hsm-rebuild` — **this dir** — the fresh rebuild (`rebuild` branch)
- `/home/sentry0/apps/hero-system-mobile` — legacy app (`master`), the source we port from
  and the golden-master reference. Its `src/lib/` and `src/decorators/` are what we pilfer.

The two share one `.git`. Don't confuse the two trees.

## Architecture invariant (enforced)

Three layers; the dependency direction is `app → infra → core/ports ← core`:

- `src/core/` — **pure TypeScript domain. No `react-native`, `react`, `infra/`, or `app/`
  imports.** ESLint (`no-restricted-imports`) blocks violations; the guard is verified to
  fire. Platform needs are reached only through interfaces in `src/core/ports`.
- `src/infra/` — native adapters implementing `core/ports` (rng, persistence, files, sound).
- `src/app/` — UI (screens, components, navigation, store, theme). Entry: `src/app/App.tsx`,
  wired via root `index.js`.

Path aliases: `core/*`, `infra/*`, `app/*` (babel-plugin-module-resolver + tsconfig paths),
resolve in build and tests.

## Commands

- `npm start` (add `--reset-cache` to clear Metro)
- `npm run android` / `npm run ios`
- `npm test` — Jest, two projects: `core` (pure node) and `app` (react-native preset)
  - single: `npx jest src/core/dice` or `npx jest --selectProjects core`
- `npm run lint` — ESLint (includes the pure-core guard)
- `npx tsc --noEmit` — typecheck
- Before committing non-trivial changes, run lint + tsc + test; all must be green.

## Code style

4-space indent, single quotes, trailing commas, no bracket spacing, arrow parens always,
160-col max (Prettier `.prettierrc.js`). Matches legacy.

## Native identifiers (align with legacy for store cutover)

- Android `applicationId`/`namespace`: `com.herogmtools` (already the RN default here)
- iOS bundle ID: `org.diceless.herogmtools` — **still needs setting** (deferred to infra/release)
- App display name: "HERO System Mobile"; RN component name: `herogmtools`
- Legacy at cutover: versionCode 62, versionName 2.3.0

## Status / next step

**Phase 0 (scaffold + tooling) is complete** — commit `72e1ca2`.

**Next: Phase 1 — dice vertical slice.** Port legacy `src/lib/DieRoller.js` math into
`src/core/dice` behind an injected `Rng` port (drop the `App.js` `getRandomNumber` coupling
and the `statistics` side-effect — return a result object instead). Stand up the
golden-master test harness comparing against the legacy roller before porting the 79
decorators. See the Progress section of `REBUILD_PLAN.md`.
