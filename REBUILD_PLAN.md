# HERO System Mobile — Clean-Room Rebuild Plan

> Living document. Target stack: **React Native CLI (modern 0.7x)**, **full TypeScript**,
> **Redux Toolkit** for state. Scope: **everything fresh** — new scaffold, new UI, new
> infra; port only the domain logic (Tier 1/2 below).

## Progress

- [x] **Phase 0 — Scaffold** *(done)* — RN 0.79.2 + TS on the orphan `rebuild` branch at
  `../hsm-rebuild`. Layered `core`/`infra`/`app` layout, path aliases, ESLint pure-core
  guard (verified firing), Prettier matched to legacy, Jest split into node `core` +
  `react-native` `app` projects. Commit `72e1ca2`. lint/tsc/jest all green.
- [ ] **Phase 1 — Core port** *(in progress)* — porting the domain, dice-first.
  - [x] **dice vertical slice** *(done, commit `0eaa05b`)* — `DieRoller` math ported into
    `core/dice` behind an injected `core/ports` `Rng` (the `App.js` `getRandomNumber` coupling
    and the `statistics` side-effect are gone; methods return a result object). Golden-master
    harness stands: a seeded `pure-rand` `Rng` drives both the real legacy roller (App +
    Statistics mocked) and the new core off one seed, asserting byte-identical results across
    22 scenarios × 30 seeds; scripted-RNG unit tests pin exact body/stun/knockback. lint
    (incl. pure-core guard) + tsc + jest (673 tests) green.
  - [x] **`templates/`** *(done)* — `HeroDesignerTemplate.getTemplate` + finalize/merge
    (characteristics + 8 item categories, with `remove` directives) ported into `core/templates`;
    the 13 rules JSON copied verbatim into `core/data/herodesigner`. Legacy `toast`-on-unknown-id
    coupling replaced with an injected `onUnrecognized` hook. Golden master (11 built-ins + 2
    unrecognized + 4 custom overlays) pins byte-identical output to legacy, including its quirks
    (case-sensitive characteristic removal, copied `remove` artifact, ignored `mainapp`). 697 tests green.
  - [ ] `hero/` + `traits/` — character model + the 79 decorators (the bulk) *(in progress)* —
    scoped in [`docs/HERO_TRAITS_SLICE.md`](docs/HERO_TRAITS_SLICE.md).
    - [x] **golden-master corpus** — 37 real `.hdc` characters, sanitized (PII stripped,
      secret identities → John/Jane Smith, portraits → picsum placeholders), committed under
      `fixtures/characters/`; parsed into JSON fixtures at `src/core/hero/__tests__/fixtures/`.
    - [x] **sub-phase 1 — `core/util` + constants** — the pure half of `Common` ported to
      `core/util` (`change-case` pinned 5.4.4), and `core/hero/constants.ts` breaking the
      `HeroDesignerCharacter ⇄ decorators` import cycle.
    - [x] **sub-phase 2 — `core/hero` character model** *(done)* — `getCharacter`
      normalize/populate pipeline + all query calcs (characteristic/roll totals,
      figured-5E, defense/resistant/unusual, framework predicates), ported faithfully
      and golden-mastered vs the real legacy engine over all 37 fixtures (getCharacter
      byte-identical; query methods across both showSecondary settings). Legacy engine
      loaded in pure node via react-native/toast stubs + App/Statistics mocks.
    - [x] **sub-phase 3 — `core/traits`** *(done)* — all 79 decorators ported (cost engine +
      factory + skill/perk/talent/power sub-factories + frameworks: multipower, elemental
      control, compound power, VPP, naked modifier + AOE/DOT modifiers + martial-arts
      maneuvers). The decorator golden master decorates every trait in all 37 fixtures and
      matches legacy `cost`/`activeCost`/`realCost`/`roll` byte-for-byte (empty skip-list).
      **`hero/` + `traits/` — the HERO System rules engine — is complete.** 1154 core tests.
    - [ ] **correctness pass** *(deferred, after sub-phase 3)* — the port is faithful
      bug-for-bug so the golden masters can assert parity; the legacy quirks/bugs found
      along the way are catalogued in [`docs/KNOWN_DEVIATIONS.md`](docs/KNOWN_DEVIATIONS.md)
      and fixed afterward as isolated commits (each: fix + correctness test + golden-master
      re-base). Notably H3: duplicate defenses (e.g. two Force Fields) currently total zero.
  - [x] **`combat/`** *(done)* — `CombatDetails` ported (combat values + per-SPEED phase
    chart, 5E/6E, primary/secondary; `sync` preserves phase state). Golden-mastered over
    all 37 fixtures. **Phase 1 core domain port is complete** — the entire HERO System rules
    engine (dice, templates, util, hero, traits, combat) is ported and golden-mastered.
  - [ ] ~~`random/` — `RandomCharacter`~~ **dropped from the port.** The current random
    character creator is being reimagined (bigger ambitions), so it is *not* ported
    as-is; it'll be designed fresh later rather than carried over. (`RandomCharacter.js`
    stays available in the legacy tree for reference.)
- [ ] **Phase 2 — Ports + infra adapters** — persistence design is specced in
  [`docs/PERSISTENCE.md`](docs/PERSISTENCE.md): SQLite (op-sqlite) as the runtime source
  of truth, portraits as files on disk, `.hsmc` demoted to export-only, `loadout` dropped,
  edition derived per-character, one-time AsyncStorage→SQLite user migration.
- [ ] **Phase 3 — State (RTK slices)**
- [ ] **Phase 4 — UI (12 screens)**
- [ ] **Phase 5 — Migration + parity + release**

> The living copy of this plan is on the `rebuild` branch (in `../hsm-rebuild`), where
> active work happens. This `master` copy is the historical/reference snapshot.

## Goal & guiding principle

Rebuild the app on a clean, typed foundation while preserving the hard-to-recreate
domain IP: the HERO System rules engine (dice math, Hero Designer character model, the
79 trait decorators that compute costs/rolls/modifiers, combat calculations) and the
`public/*.json` rules data.

**Core invariant:** the domain layer (`src/core/`) has **zero `react-native` imports**.
It is pure TypeScript, unit-testable in plain Node, and depends only on injected *ports*
for anything platform-specific (randomness, persistence, files, sound). This is the single
architectural rule that everything else serves — it is lint-enforced.

## Why rebuild (the coupling we're paying off)

The current codebase works but is tangled:

- `DieRoller` imports `getRandomNumber` from `App.js` (logic reaching up into the app root)
- `DieRoller` writes to `statistics` as a side effect of rolling
- `SoundPlayer` reads globals off `App.js`
- `File ⇄ Persistence ⇄ Statistics ⇄ Character` form a circular dependency web
- `Common` mixes pure helpers with `Dimensions` / `Platform` / `Toast`
- `Chart.js` lives in `lib/` but is actually a React component
- The Hero Designer character model is untyped objects parsed from XML

A fresh build is the moment to fix all of this by construction rather than incrementally.

## Target architecture

Single RN-CLI TypeScript app, internally layered:

```
src/
  core/                 # PURE TypeScript — no 'react-native' imports (lint-enforced)
    dice/               # <- DieRoller math + partial-die constants
    hero/               # <- HeroDesignerCharacter model + parsing (typed)
    templates/          # <- HeroDesignerTemplate
    traits/             # <- the 79 decorators (CharacterTrait + decorators tree)
    combat/             # <- CombatDetails
    util/               # <- pure half of Common
    data/               # <- public/*.json (HERO rules), imported statically
    ports/              # interfaces: Rng, StatisticsSink, Clock, ...
  infra/                # native adapters that IMPLEMENT core/ports
    rng/                # pure-rand / Math.random behind Rng
    persistence/        # <- Persistence.js rewritten (sqlite + AsyncStorage migration)
    files/              # <- File.js rewritten (picker, RNFS, zip, xml2js, iconv)
    sound/              # <- SoundPlayer.js rewritten behind a Sounds port
  app/                  # UI
    screens/            # 12 screens
    components/         # reusable UI (incl. former Chart.js)
    navigation/         # React Navigation drawer
    store/              # Redux Toolkit slices (retyped)
    theme/              # color theme / dark mode
```

### Dependency direction

`app` → `infra` → `core/ports` ← `core`

`core` never imports from `infra` or `app`. `infra` implements the interfaces declared in
`core/ports`. `app` wires concrete infra adapters into the core at startup.

## Decoupling moves

| Current smell | Clean-build fix |
|---|---|
| `DieRoller` imports `getRandomNumber` from `App.js` | Inject an `Rng` port; caller wires `pure-rand` or `Math.random` |
| `DieRoller` writes to `statistics` as a side effect | Return a result object; a `StatisticsSink` subscribes at the app layer |
| `SoundPlayer` reads `App.js` globals | Adapter behind a `Sounds` port; core never references it |
| `Common` mixes pure utils + `Dimensions`/`Toast` | Split: pure → `core/util`, RN bits → `app` |
| `Chart.js` in `lib/` | Moves to `app/components` |
| `File ⇄ Persistence ⇄ Statistics ⇄ Character` cycle | Ports + repositories; `Character.js` folded away |
| Untyped HD character objects | TS interfaces for parsed character, traits, templates |

## Reuse verdict per module

**Tier 1 — port ~as-is, add types (pure domain IP):**
- The 79 decorators under `src/decorators/` (base `CharacterTrait`, decorator tree)
- `HeroDesignerCharacter.js` (character model + parsing)
- `HeroDesignerTemplate.js` (rules-template mapping)
- `CombatDetails.js` (combat math)
- All `public/*.json` rules data

> **Not ported:** `RandomCharacter.js` (the random character creator) is being
> reimagined rather than carried over — see the Progress notes. Dropped from the port.

**Tier 2 — port with decoupling:**
- `DieRoller.js` — dice math is gold; inject `Rng`, emit results instead of writing stats
- `Common.js` — split pure utils from RN-coupled bits
- `Statistics.js` — decouple from `DieRoller` constants + `Persistence`

**Tier 3 — rewrite, don't pilfer (native-bound plumbing):**
- `File.js` (document picker, RNFS, zip, xml2js, iconv)
- `Persistence.js` (AsyncStorage + SQLite migration glue)
- `SoundPlayer.js` (react-native-sound + App globals)
- `Character.js` (thin wrapper over File — fold away)

## Confidence strategy — golden-master tests

A rules engine fails *silently*: a wrong point cost or skill roll still renders fine. To
make "everything fresh" safe:

1. Before/while porting, capture the **current** app's outputs as fixtures:
   - Cost / roll / modifier results for a set of real `.hdc` characters (all genres: Heroic,
     Superheroic, 5E and 6E, Automaton/AI/Computer variants).
   - Seeded dice-roll sequences for each roll type (normal, killing, to-hit, effect, skill).
2. Assert the ported TS core reproduces **identical** numbers.
3. Keep these as regression tests permanently.

This is the safety net that lets us re-architect aggressively.

## Dependency pruning (fresh scaffold = drop dead weight)

- `deprecated-react-native-prop-types` — remove
- `react-native-slider@0.11` (unmaintained) — use `@react-native-community/slider` (already present)
- `react-native-iphone-x-helper` — replace with `react-native-safe-area-context`
- `redux-mock-store` — move to devDeps or drop in favor of RTK's own testing utilities
- `react-native-sectioned-multi-select@0.10` — re-evaluate / replace
- `stream` / `buffer` polyfills — keep only if xml/zip paths still require them

## Repo strategy

Stay in **this repo** — do not create a new one. The existing repo holds the app's signing
keys, store metadata, bundle IDs, and release/build config for three storefronts (Play
Store, App Store, Amazon Appstore); recreating those buys nothing. It is not a *legal*
clean-room (it's our own code), so keeping the old code reachable is an asset — it powers
the golden-master tests.

Isolation approach: **orphan branch in a sibling worktree**.

- The **primary directory stays on `master`** (the legacy app) — it already carries the
  installed toolchain (`node_modules`, built `android/`/`ios/`) and the store/release config.
- The fresh app is built on an **orphan branch** (`rebuild`) checked out in a **sibling
  worktree** so its root is clean — none of the old files, no scaffold collision when
  `react-native init` regenerates `android/` and `ios/`. The legacy tree stays one
  directory over for side-by-side reference and golden-master diffing.

  ```sh
  # from the primary (master) checkout:
  git worktree add -b rebuild --orphan ../hsm-rebuild   # clean root for the fresh scaffold
  # legacy app remains in place at the primary dir on master
  ```

  Note: you cannot `git worktree add` the branch that is already checked out in the primary
  dir, and `--orphan` on `worktree add` (git ≥ 2.42) takes the branch via `-b` with the path
  as the sole positional arg.

- Full history stays in the repo (blame on the 79 decorators remains available).
- **Cutover:** when the rebuild reaches parity, promote `rebuild` to the default branch
  (or merge with `-X theirs` / a squash) so the store config and history carry forward,
  then remove the worktree (`git worktree remove ../hsm-rebuild`).

## State management

Keep **Redux Toolkit**. The 9 existing slices (`appState`, `character`, `forms`,
`randomHero`, `settings`, `statistics`, `version`, plus `selectors` and `index`) port
cleanly to typed RTK slices. Lowest risk, already understood.

## Phased execution

### Phase 0 — Scaffold
- Fresh RN 0.7x CLI + TypeScript project
- Path aliases (`core/*`, `infra/*`, `app/*`)
- ESLint rule banning `react-native` imports inside `src/core/`
- Prettier config matching current style (4-space, single quotes, trailing commas, 160 cols)
- Jest configured for both core (node) and RN component tests

### Phase 1 — Core port (largest phase)
Order chosen so each layer builds on tested foundations:
1. `dice/` — most self-contained, most testable; establishes the golden-master harness
2. `templates/` — data mapping over `public/HERODesigner/*.json`
3. `hero/` + `traits/` — the character model and the 79 decorators (the bulk of the work)
4. `combat/` — combat math (`RandomCharacter` dropped; being reimagined)
Each with golden-master + unit tests before moving on.

### Phase 2 — Ports + infra adapters
- Define `core/ports` interfaces (`Rng`, `StatisticsSink`, `Clock`, repositories)
- `infra/rng` (pure-rand + Math.random)
- `infra/persistence` (SQLite + AsyncStorage→SQLite migration)
- `infra/files` (picker, RNFS, zip, xml parse)
- `infra/sound`

### Phase 3 — State
- Retype the 9 Redux slices; wire infra adapters via store middleware/thunks

### Phase 4 — UI
- Rebuild the 12 screens on the clean core:
  Home, Characters, Skill, Hit, Damage, Effect, Result, CostCruncher,
  RandomCharacter, Statistics, Settings, ViewHeroDesignerCharacter
- Rebuild reusable components (incl. former `Chart.js`)

### Phase 5 — Migration + parity + release
- Migrate existing users' AsyncStorage/SQLite data
- Full parity pass against current app behavior
- Store releases (Play Store, App Store, Amazon Appstore)

## Open questions / decisions to revisit

- Monorepo vs single-package: currently single app with an import-clean `core/` folder.
  Revisit only if a second consumer (web) becomes a real goal.
- Whether to publish `core/` as a standalone package later (it's designed to allow it).
- Replacement choice for `react-native-sectioned-multi-select`.

## Inventory snapshot (at plan time)

- `src/lib/`: 12 modules, ~3,400 lines
- `src/decorators/`: 79 files (the rules engine)
- `src/components/Screens/`: 12 screens
- `src/reducers/`: 9 slices
- `public/`: HERO Designer rules JSON (5E + 6E genre templates), hit locations, senses,
  speed/strength tables, moves, random-character templates, images
