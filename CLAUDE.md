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

**The rebuild ships.** It is on the store past legacy's cutover, the rules engine is fully
ported and golden-mastered, and every corpus-triggered engine bug is fixed. **2.7.1
(versionCode 68) is the last build out.** **2.8.0 (versionCode 69) is staged**: in-app
character **authoring** (see [`docs/CHARACTER_AUTHORING.md`](docs/CHARACTER_AUTHORING.md)),
schema 7 → 8.

**2.8.0 changes no costs, but it does change how a framework renders on characters people
already have.** H2 is fixed, so a Multipower / Elemental Control / VPP nests its slots
instead of leaving them loose beside an empty container — 27 of the 37 fixtures. The points
were always right; only the arrangement was wrong. So in 2.8.0 a *cost* that moves is a
regression, and a *layout* that moves is the fix.

What remains is CostCruncher, the cosmetic tail of the correctness pass, and shrinking
authoring's withheld list (`BESPOKE` in `core/authoring/catalogue.ts`).

| Phase | State |
|---|---|
| 0 — Scaffold | ✅ done |
| 1 — Core port | ✅ done — `dice`, `templates`, `util`, `hero`, `traits`, `combat`; golden-mastered over all 37 fixtures |
| 2 — Ports + infra | ✅ done — `rng`, `files`, `import`, `migration`, `persistence`; sound dropped |
| 3 — State (RTK) | ❌ **not done, and deliberately reversed** — see below |
| 4 — UI | 11 screens; **CostCruncher** is the only one outstanding. Random characters are built — reimagined, not ported (see below) — and roll in both editions from `GenerateDialog`. **Authoring** is built across `AuthorCharacterScreen` (the lists) and `AuthorTraitScreen` (one trait's form) |
| 5 — Migration + parity + release | migration done + device-validated; **releases shipping**; every corpus-triggered bug fixed, cosmetic tail open |

`REBUILD_PLAN.md`'s Progress section has drifted (it still shows Phase 1 unchecked and
prescribes redux). **This section is the source of truth for status.**

**Phase 3 was reversed, not skipped.** The plan says "Keep Redux Toolkit… the 9 existing
slices port cleanly". There is **no redux**: zero dependencies, `src/app/store/` holds only a
`.gitkeep`, and state is React context (`DiceProvider`, `ImportProvider`,
`RepositoriesProvider`, `SettingsProvider`) plus local `useState`. Treat that as the standing
decision unless revisited. One known consequence: the sheet's Alternate Identity toggle is
component-local and resets to on at every mount, where legacy persisted `showSecondary`.

`DiceScreen` consolidates legacy's five Skill/Hit/Damage/Effect/Result screens into one.

**Characters now come from three places, and `origin` is what tells them apart.** An
`imported` `.hdc` is the player's file and stays read-only. A `generated` one is rebuilt from
its `recipe`. An `authored` one is rebuilt from its `source` — the `ParsedCharacter` it was
emitted from, stored in its own column because `data` holds the engine's *output* and that
does not round-trip. See [`docs/CHARACTER_AUTHORING.md`](docs/CHARACTER_AUTHORING.md); the
recurring lesson there is **the template is consulted for prices, the trait for everything
else**, which cost three separate debugging sessions to learn.

**Random characters were reimagined, not ported.** `src/core/random/` (see
[`docs/RANDOM_CHARACTER.md`](docs/RANDOM_CHARACTER.md)) is clean-room: legacy's
`RandomCharacter.js` is **not an oracle for it** and it is deliberately not golden-mastered —
the same discipline as `core/`, for the opposite reason. It emits a `ParsedCharacter` (the
`.hdc`-shaped *input*) and runs it through `heroDesignerCharacter.getCharacter()`, so a
generated character is priced by the same engine that reads a real `.hdc` and is saved down
the same path. **Both editions ship**: 5E Low Powered (250) and 6E Standard (400), chosen from
the pills in `GenerateDialog`. `POWER_LEVELS` names two more (`5e-standard`, `6e-low`) that have
no authored archetypes or powersets — the dialog does not offer them, because offering them
would be offering a crash.

The 6E half is **authored, not lifted** — there is no legacy 6E prose. Its archetype spreads are
benchmarked against the five real 400-point characters in the fixture corpus and scored against
`core/random/ruleOfX.ts`, which is Phil's own spreadsheet in code (±10% band). Two of his rules
are encoded in the data rather than the engine, so don't "fix" them: **no VPPs** (multipowers
instead) and **no CSLs at creation** (re-invest in base OCV/DCV).

Three consequences worth knowing:

- **Building characters found engine bugs the 37-fixture corpus never did** — H9 and H10 were
  both caught by generating, not by importing. The decade-old archetype prose acts as a second
  oracle: it independently priced `ES: PER +1` at 3 and `Clinging 20 STR` at 10, siding with
  the template against the code. Both were real shipped bugs.
- **A generated character carries a recipe** (`core/random/recipe.ts`), stored in its own
  column beside the document. Editing revises the recipe and rebuilds — there is no partial
  mutation path. Only `origin: 'generated'` rows are editable; an imported `.hdc` is the
  player's file and stays read-only.
- **Generate deals a hand of five and keeps one** (`core/random/hand.ts`), rather than weighting the
  archetype distribution. Weighting was asked for and lost on the maths: **uniform is the
  minimum-collision distribution**, so weighting makes two players clashing *more* likely, not less.
  Four phones can't coordinate anyway. Archetypes within a hand are forced distinct because **every
  archetype has exactly one powerset** — a repeated archetype is a repeated character, not just a
  repeated label. That 1:1 is also the strongest argument for authoring more powersets.
- **`level` is the only thing that says which edition a recipe means**, and the editions share
  nearly every name: all eleven archetypes, all eleven professions, the four complication
  labels, and six of the eleven powerset labels (Powerhouse, Adept, Sorcerer, Blur, Sentinel,
  Energy Blaster). **A lookup done in the wrong edition therefore succeeds and returns the wrong
  data rather than failing.** Never let a caller default the edition: `recipeEdition(recipe)`
  reads it off the recipe, and `resolveRecipe` does it for you. This has bitten twice — once on
  the roll path (`8afb588`) and once on the edit path (`ecdccf7`), where it hid for months
  behind those six colliding labels.

**Two silent traps in the data, both of which have shipped bugs.** A trait the edition lacks
resolves to no template and prices at **0**, reading as authored (LACKOFWEAKNESS, SEDUCTION,
AREA_KNOWLEDGE, LIGHTNING_REFLEXES_SINGLE all did). And NCM has a hardcoded `basecost` with no
template in *either* edition, so the template guards miss it entirely — 6E abolished it, and it
needs its own test.

`RandomHeroRepository` / the `random_hero` table are a **legacy relic**: `migrateV1` still
writes the old app's saved random hero there, and nothing reads it. The new generator saves
generated characters as ordinary character rows. Don't wire it up expecting it to matter —
it's data preservation, not a feature.

## The correctness pass

`core/*` reproduces the legacy engine **byte-for-byte**, so the golden masters prove
**parity, not correctness** — a number of legacy bugs were preserved on purpose.

> **Read [`docs/KNOWN_DEVIATIONS.md`](docs/KNOWN_DEVIATIONS.md) before changing anything in
> `core/`.** 20 entries; 13 fixed (H2–H12, U2, U3) — every known corpus-triggered bug is now
> fixed. It explains why a "wrong-looking" line in `core/` may be load-bearing, and why a
> green golden master does not mean correct.

**These fixes are visible to users.** They ship in 2.5.0, and eight of them re-based golden
masters — H8 alone moves 14 of the 37 fixtures. Roughly a third of real characters read
differently than they did in 2.4.1. When a tester reports a changed cost, the question is not
"did we break it" but "do we now agree with HERO Designer".

Process per fix — follow it; the ledger explains the reasoning:

1. One isolated commit per quirk.
2. Code fix + a correctness test pinning the new value, **derived from the HERO rules.
   Legacy is not a valid oracle for corrected behaviour** — where a quirk is corpus-triggered,
   legacy is wrong there too.
3. Re-base the affected golden master to an explicit intentional divergence, with a comment
   linking back to the ledger entry (see `H3_DIVERGENCE` / `U2_DIVERGENCE` for the shape).

Still open — none is corpus-triggered: **T1–T4** are template-output only, **H1** and **U1** are
cosmetic, and **H13** is latent (a Multipower slot's divisor never varies, because `ultraSlot` is
read off the wrapper rather than the trait; every corpus slot is fixed, so nothing sees it).

**H2 is a cautionary tale about this ledger's own confidence.** It sat open for the whole port
described as display-order-only, on the reasoning that "point totals are order-independent" — which
was true, and hid the real bug. The comparator could never move a trait earlier, and framework
containers are appended *last* by normalization, so every Multipower, Elemental Control, VPP and
Skill Enhancer in the corpus lost its slots to the top level: 27 of 37 fixtures, `m-championsmush`
alone 148 orphans. Costs really were unaffected (`getParent` scans the flat list), so no cost test
ever caught it. **A ledger entry's "corpus impact" line is a hypothesis, not a measurement** — H2's
was written from reading the code and was wrong for years. Measure before believing one.

Its fix also established that **fixing a structural quirk means teaching every caller to descend**:
`withDescendants` (`core/util`) plus `TRAIT_CHILD_KEYS` (`core/hero`), because the child key is not
`powers` for most categories.

**Three places compute `STR / 5` into damage dice, and since H11 all three agree** — `maneuver.ts`,
`handToHandAttack.ts`, and `heroDesignerCharacter.getStrengthDamage()`. Folding them into one
shared helper is now a safe mechanical sweep and is worth doing; `handToHandAttack.test.ts` pins
the rule across STR 0–80 in all three, so a slip would be caught.

**One rules question is open in `handToHandAttack.ts`, deliberately.** Its `PLUSONEPIP` /
`PLUSONEHALFDIE` branches render `partialDie ? ${dice + 1}d6`, i.e. "N½d6 plus another half is
(N+1)d6". That matches the `Nd6 → Nd6+1 → N½d6 → (N+1)d6` progression, but whether `+½d6` advances
one step or two wasn't verifiable without the rulebook, and no fixture exercises it. It's pinned
as-is rather than guessed at — **if you're in there with 6E1 to hand, check it.**

A known non-quirk worth knowing: the visibility rule
`(affectsPrimary && affectsTotal) || (!affectsPrimary && affectsTotal && showSecondary)` is
inlined at ~40 sites. H8 introduced `countsTowardTotal()` for it, but only the two sites it
touched use the helper. Folding in the rest is a mechanical sweep worth doing on its own,
never alongside a behaviour change.

A lesson worth keeping from H4: `characterSheet.ts:333` wraps every trait in a try/catch that
degrades a throwing trait to a stub row (cost 0, no combat line). **A core bug can therefore
surface as quietly wrong data rather than a crash** — H4 mis-rendered one of tazimmaad's
maneuvers for the whole life of the port without anyone seeing an error. When checking impact,
build the sheet and read the values; don't just look for exceptions.

## Gestures are testable — don't assume otherwise

react-test-renderer does no hit testing, so a finger can't be simulated. It is tempting to
conclude gestures can't be tested, extract the maths, test that, and call the rest untestable
wiring. **That reasoning shipped the portrait framer broken twice, and neither bug was in the
maths.**

Everything below `panHandlers` is RN's own code. Driving them with a synthetic `touchHistory`
runs the real `PanResponder`, deriving `gestureState` exactly as a device does — see
`src/app/screens/__tests__/PortraitFramer.test.tsx`. Only touch *delivery* is missing, so what
a phone still settles is narrow: does a finger land on the view you think it does.

Two RN traps the framer hit, both worth knowing before writing another gesture:

- **`event.nativeEvent.touches` is filtered to the event's target** and does not reliably carry a
  second finger. RN's own multitouch maths reads `event.touchHistory.touchBank`
  (`touchActive`, `currentPageX/Y`) plus `gestureState.numberActiveTouches`. Note RN's
  **TypeScript** types omit `touchHistory` from `GestureResponderEvent`; Flow has it, and
  PanResponder reads it every move. The types are wrong, not the event.
- **A multi-touch move never reaches `onPanResponderMove`.** RN dispatches
  `onMoveShouldSetResponderCapture` to the current responder (its own source calls this
  "incorrect"); that stamps `_accountsForMovesUpTo`, and `onResponderMove` then returns early.
  A one-finger drag skips the capture dispatch, so pan works while pinch silently never fires.
  Handle the move from both paths, guarded on `touchHistory.mostRecentTimeStamp`.

Also: never put live state in a `PanResponder`'s `useMemo` deps. Rebuilding it mid-gesture swaps
the View's handlers under an in-flight touch, and the next move arrives as a fresh gesture with
`dx/dy` of 0 — the image snaps back to where the drag started. Read mutable values through refs.
