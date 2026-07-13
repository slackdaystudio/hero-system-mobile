# Phase 1 — `hero/` + `traits/` slice (scope & plan)

> The largest slice of the rebuild: the HERO System rules engine. Scoped after a
> full read of legacy `src/lib/HeroDesignerCharacter.js` (1,169 lines) and the 79
> decorator files under `src/decorators/`. Companion to `REBUILD_PLAN.md`.

## Size & shape

| Piece | Legacy source | Notes |
|---|---|---|
| `hero/` — character model | `HeroDesignerCharacter.js` (1,169 lines) | `getCharacter(parsedXml)` → normalized character; pure, deterministic (no RNG) |
| `traits/` — the decorators | 79 files (22 root / 8 skills / 4 modifiers / 4 perks / **37 powers** / 4 talents) | **zero `react-native`/`react`/UI imports** — pure logic |

This is ~3–5× the templates slice. It must be broken into sub-steps (below); it is
not a single push.

## How it works (from recon)

**`hero/` pipeline** — `getCharacter(parsedXml)` (`HeroDesignerCharacter.js:88`):
resolves the template (via the already-ported `core/templates`), normalizes the
character + template data, then `_populateTrait` for each category (skills, perks,
talents, martial arts, powers, disadvantages, equipment), enriching each trait item
with its matched template entry. Also computes characteristic totals, defenses, and
skill-roll bases. Output is a normalized character object of typed trait arrays.

**`traits/` decorator stack** — `CharacterTraitDecorator.decorate(item, listKey, getCharacter)`
(`CharacterTraitDecorator.js:33`) wraps a base `CharacterTrait` in layers:
`Skill`/`BaseCost` → `Maneuver`/`Complication` → a per-category sub-factory
(`SkillDecorator`/`PerkDecorator`/`TalentDecorator`/`PowerDecorator`) → **always**
`ModifierCalculator` → special-case (`CompoundPower`, `NakedModifier`) → framework
layer (`MultipowerItem`/`ElementalControlItem`/`VariablePowerPool`). `PowerDecorator`
alone dispatches ~55 xmlids and its `default` branch re-dispatches by `originalType`.

**The decorator contract** — every class extends `CharacterTrait` and overrides a
subset of 11 methods. The **load-bearing numeric ones for the golden master**:
- `cost()` — base point cost (most of the 79 overrides touch this)
- `activeCost()` = `cost × (1 + Σ advantages)`, `roundInPlayersFavor` (`ModifierCalculator.js:37`)
- `realCost()` = `activeCost / (1 − Σ limitations)` + skill-enhancer discount (`ModifierCalculator.js:48`)
- `advantages()` / `limitations()` — signed partition of the modifier list
- `roll()` — `{roll, type}` for skill checks / damage dice (secondary surface)

`label()`/`attributes()`/`definition()` are presentational — verified but not numeric.

## Dependencies & build order

```
traits/  →  hero/  →  (shared constants)
   └──────────────→  core/util (pure Common)     core/templates (done)
```

Prerequisites that must land first:

1. **`core/util`** — the 12 pure `Common` helpers the engine uses: `toMap` (46×),
   `roundInPlayersFavor` (31× — the rounding rule under all cost math), `totalAdders`,
   `flatten`, `getMultiplierCost`, `toCamelCase`/`toSnakeCase`, `isEmptyObject`,
   `toKg`/`toCm`, `isInt`, `hasModifier`. None touch `Dimensions`/`Toast`. This is the
   plan's "pure half of Common." `toCamelCase`/`toSnakeCase` use `change-case` — **add
   the same version** rather than reimplement, so casing behaviour can't drift the
   golden master.
2. **Shared constants module** — break the confirmed import cycle
   (`CharacterTraitDecorator → HeroDesignerCharacter → decorators/skills/Roll`) by moving
   `SKILL_ROLL_BASE`, `SKILL_ENHANCERS`, `CHARACTERISTIC_NAMES`, and the die-type enums
   into a dependency-free module. Then the graph is strictly one-directional:
   `traits/ → hero/ → constants` (hero never calls the decorators; the decorators query
   the character via injected functions).

## Coupling to untangle (the real work)

1. **The import cycle** — resolved by the shared-constants module above.
2. **`getCharacter` closure threaded through every constructor** (73/79 files). Traits
   reach back into the whole character at compute time (characteristics, parent
   frameworks). Port keeps this as an *injected* accessor (already a form of DI) — no
   globals — so decorators stay pure functions of (trait, character).
3. **Re-entrant factories** — `CompoundPower` and `PowerDecorator`'s default branch call
   the factory recursively; `CharacterTraitDecorator` passes `this` into `CompoundPower`.
   Port the factory as a module with an explicit recursion entry point.
4. **Untyped trait bag** — everything is `hasOwnProperty` / `xmlid.toUpperCase()` probing
   of a dynamic XML-derived object where `template`/`adder`/`modifier`/`option` may each
   be an object OR an array. The port needs a **discriminated-union trait model** plus a
   normalization step that guarantees adder/modifier are always arrays. This typing is
   the single largest design effort in the slice.
5. **Template-dependent cost math** — `BaseCost`/`Modifier`/`Skill` read `lvlcost`,
   `lvlval`, `mincost`, `maxcost`, `basecost`, `option` off the template. `core/templates`
   already supplies these; the trait model must carry the resolved template entry.

## Proposed sub-phases (each: port + golden-master + unit tests, all green before next)

1. **`core/util` + constants** — the pure Common helpers and the shared constants module.
   Small, unblocks everything. Golden-master the helpers against legacy `Common`.
2. **`core/hero` — character model** — the trait model types + normalization +
   `getCharacter` pipeline + characteristic/defense/roll computations. Golden-master
   `getCharacter(fixture)` output equality vs legacy.
3. **`core/traits` — decorators, in tiers** (recon complexity buckets):
   - a. base contract (`CharacterTrait`) + `BaseCost` + `Skill`
   - b. `Modifier` + `ModifierCalculator` (the universal advantage/limitation layer — the
     single most important numeric class)
   - c. the ~35 trivial + ~30 moderate leaf decorators (skills, perks, talents, most powers)
   - d. the ~14 complex/recursive: `CompoundPower`, `Multipower`/`ElementalControl`/`VPP`,
     `Maneuver` (308 LOC), `Summon`, `MultiForm`, `Duplication`, `Complication`, etc.
4. **Golden-master harness** — see below; grows as each tier lands.

## Golden-master strategy

The engine fails silently (a wrong point cost still renders), so this is non-negotiable.

- **Inputs = real `.hdc` characters.** *(BLOCKER — none are checked into the repo.)* We
  need a diverse set spanning the matrix: Heroic + Superheroic, **5E + 6E**, and the
  Automaton / AI / Computer variants, plus at least one character exercising each
  framework (multipower, elemental control, VPP, compound power) and martial arts.
- **Fixture pipeline:** parse each `.hdc` once through the legacy `File` path (xml2js) to
  get the parsed-object input, and commit those as JSON fixtures under
  `core/hero/__tests__/fixtures/`. Parsing stays in infra (Tier 3); the core tests take
  pre-parsed input.
- **Comparison:** run the **real legacy engine live** in the core Jest project (as we did
  for dice/templates), mocking `react-native` + `react-native-toast-message` so legacy
  `Common` loads in node. Assert:
  - `hero/`: `getCharacter(fixture)` deep-equals legacy for every fixture.
  - `traits/`: for every trait in every fixture, `cost()` / `activeCost()` / `realCost()`
    / `roll()` equal legacy — a matrix of (characters × traits × numeric methods).
- These fixtures + assertions become **permanent regression tests** (the plan's safety net).

## What I need from you

1. **The `.hdc` fixture set** — the hard blocker. Ideally 8–15 real characters covering
   the matrix above. You're the app author, so you likely have these; otherwise we source
   a spread of sample builds.
2. Confirm **`core/util` as its own sub-slice first** (recommended) vs folding it into `hero/`.
3. Confirm **add `change-case`** (same version) vs reimplement casing.
4. **PR/commit granularity** — one commit per sub-phase (recommended), or finer per
   decorator tier.

## Risks

- **Silent numeric drift** — mitigated only by fixture breadth; thin coverage = false
  confidence. Fixture sourcing is the critical path.
- **The 37 powers** and the recursive framework tier are where subtle cost bugs hide.
- **Trait-model typing** is a large up-front design cost; getting the discriminated union
  right early pays off across all 79 decorators.
