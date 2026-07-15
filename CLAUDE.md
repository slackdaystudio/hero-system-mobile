# CLAUDE.md — HERO System Mobile (clean-room rebuild)

This is the **`rebuild` branch** of HERO System Mobile: a from-scratch, modern
React Native **0.79.2 + TypeScript** rebuild of the legacy app. `REBUILD_PLAN.md` has the
full architecture and the reasoning behind it — but its Progress section has drifted, so
take **Status** below as authoritative for where things stand.

Other docs: [`docs/KNOWN_DEVIATIONS.md`](docs/KNOWN_DEVIATIONS.md) (read before touching
`core/`), [`docs/PERSISTENCE.md`](docs/PERSISTENCE.md), `RELEASE.md`, `QA_CHECKLIST.md`.

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
- `src/infra/` — native adapters implementing `core/ports` (`rng`, `persistence`, `files`,
  `import`, `migration`). `infra/sound` is an empty placeholder — sound was dropped (`fbccfc7`).
- `src/app/` — UI (screens, components, navigation, theme). Entry: `src/app/App.tsx`,
  wired via root `index.js`. **No redux** — see Phase 3 under Status; `src/app/store/` is an
  empty placeholder.

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

## Native identifiers (aligned with legacy — cutover is done)

- Android `applicationId`/`namespace`: `com.herogmtools` (already the RN default here)
- iOS bundle ID: `org.diceless.herogmtools` — set
- App display name: "HERO System Mobile"; RN component name: `herogmtools`
- Legacy at cutover was versionCode 62 / 2.3.0. **This app now ships** — see
  `android/app/build.gradle` for the current versionCode/versionName, plus `RELEASE.md`
  (signing, store steps) and `QA_CHECKLIST.md` (on-device shakedown).

## Status

**The rebuild ships.** It is on the store past legacy's cutover, and the rules engine is
fully ported and golden-mastered. What remains is Phase 4's last screen and the Phase 5
correctness pass.

| Phase | State |
|---|---|
| 0 — Scaffold | ✅ done |
| 1 — Core port | ✅ done — `dice`, `templates`, `util`, `hero`, `traits`, `combat`; golden-mastered over all 37 fixtures |
| 2 — Ports + infra | ✅ done — `rng`, `files`, `import`, `migration`, `persistence`; sound dropped |
| 3 — State (RTK) | ❌ **not done, and deliberately reversed** — see below |
| 4 — UI | 8 screens built; **CostCruncher** is the only one outstanding. RandomCharacter dropped (being reimagined) |
| 5 — Migration + parity + release | migration done + device-validated; **releases shipping**; correctness pass in progress |

`REBUILD_PLAN.md`'s Progress section has drifted (it still shows Phase 1 unchecked and
prescribes redux). **This section is the source of truth for status.**

**Phase 3 was reversed, not skipped.** The plan says "Keep Redux Toolkit… the 9 existing
slices port cleanly". There is **no redux**: zero dependencies, `src/app/store/` holds only a
`.gitkeep`, and state is React context (`DiceProvider`, `ImportProvider`,
`RepositoriesProvider`, `SettingsProvider`) plus local `useState`. Treat that as the standing
decision unless revisited. One known consequence: the sheet's Alternate Identity toggle is
component-local and resets to on at every mount, where legacy persisted `showSecondary`.

`DiceScreen` consolidates legacy's five Skill/Hit/Damage/Effect/Result screens into one.

## The correctness pass (current work)

`core/*` reproduces the legacy engine **byte-for-byte**, so the golden masters prove
**parity, not correctness** — a number of legacy bugs were preserved on purpose.

> **Read [`docs/KNOWN_DEVIATIONS.md`](docs/KNOWN_DEVIATIONS.md) before changing anything in
> `core/`.** 14 entries; 6 fixed (H3, H4, H5, H6, H7, U2). It explains why a "wrong-looking"
> line in `core/` may be load-bearing, and why a green golden master does not mean correct.

Process per fix — follow it; the ledger explains the reasoning:

1. One isolated commit per quirk.
2. Code fix + a correctness test pinning the new value, **derived from the HERO rules.
   Legacy is not a valid oracle for corrected behaviour** — where a quirk is corpus-triggered,
   legacy is wrong there too.
3. Re-base the affected golden master to an explicit intentional divergence, with a comment
   linking back to the ledger entry (see `H3_DIVERGENCE` / `U2_DIVERGENCE` for the shape).

Still open and **active**:

- **U3** — latent float overshoot in `getMultiplications`. Cheapest one left;
  `common.test.ts` pins the current *wrong* value on purpose so the fix must change it
  deliberately.
- **Unusual defenses ignore `affectsPrimary`/`affectsTotal`** (noted under H7, not yet its own
  entry): a secondary-form Resistant Protection still feeds the Mental/Power totals at
  `showSecondary: false`, unlike every other total. Needs a rules check before fixing.

Then the cosmetic/latent tail: T1–T4, H1, H2, U1.

A lesson worth keeping from H4: `characterSheet.ts:333` wraps every trait in a try/catch that
degrades a throwing trait to a stub row (cost 0, no combat line). **A core bug can therefore
surface as quietly wrong data rather than a crash** — H4 mis-rendered one of tazimmaad's
maneuvers for the whole life of the port without anyone seeing an error. When checking impact,
build the sheet and read the values; don't just look for exceptions.
