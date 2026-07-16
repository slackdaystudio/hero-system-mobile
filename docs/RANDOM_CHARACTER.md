# Random Character Design

> Design spec for the reimagined random character generator (`core/random`). Written after
> auditing the legacy `RandomCharacter.js` and its four `public/templates/*.json` data files.
> Companion to `REBUILD_PLAN.md`, which dropped the legacy generator from the port on the
> grounds that it would be redesigned rather than carried over. This is that redesign.
>
> **Status: built.** All five phases are done — both editions roll, both are editable, and every
> 6E roll is graded against the Rule of X. This began as a plan and is now mostly a record of
> *why*, so where it says "we will", read "we did". The decisions and the traps are the part
> worth reading; each section marks what it settled.

## The problem we're solving

The legacy generator is 60 lines and does not build a character. It picks a random archetype,
gender, special effect, and then whole pre-baked **packages**:

```js
_getPowers(archtype) { return archtype.powersets[random]; }
_getSkills()         { return skills.skillsets[random]; }
```

Its output is a **character concept sheet** — prose suggestions a human then builds by hand in
Hero Designer. There are no characteristics in the output, no point allocation, and nothing
machine-checkable. The data reflects that: powers are strings with hand-typed costs
(`{"cost": 15, "power": "Armor +5 rPD +5 rED"}`, and `"cost": "5u"` for multipower slots).

What we want instead: press a button, choose a point ceiling, and get a **real, legal
character** written to the phone — full characteristics, powers, skills — that the sheet
renders and the combat tracker can use.

## What changed since the original was written

The original hand-authored its costs because it had **no way to compute them**. We now have two
things it never did:

1. **A golden-mastered rules engine** (`core/hero`, `core/traits`) that computes real costs.
2. **The complete HERO Designer template data** (`core/data/herodesigner/Main*.json`) — every
   power with its `basecost` / `lvlcost` / `lvlval`, and every modifier.

That inverts the design. Don't curate prose-and-costs; curate **constraints**, and let the
engine cost the result.

## Resolved decisions

| # | Decision | Choice |
|---|---|---|
| 0 | Alternate identity | **None.** Every power is `affectsPrimary` + `affectsTotal` — a generated character's powers always apply |
| 1 | Output shape | Generate a **`ParsedCharacter`** — the `.hdc`-shaped *input* — not a finished character |
| 2 | 250 vs 400 | **Two editions**: 250 = 5E, 400 = 6E. Not a scaling knob |
| 3 | Power generation | **Curated shapes, random selection.** Structured powersets per archetype; flex `levels` to fit |
| 4 | Legality | **Legal by construction**, engine as the cost oracle, thin validator for the rest |
| 5 | Randomness | Via the existing `Rng` port — seedable, therefore testable and fuzzable |
| 6 | Persistence | None new. A generated character saves through `characterRepository`, exactly as an import does |

### 0 — A generated character has no alternate identity

So every power is `affectsPrimary: true, affectsTotal: true`: they always apply. Imported
characters often carry `affectsPrimary: false` on defensive powers, and it is tempting to copy —
but that marks a power **alternate-form only**, which is something a player decided about *their*
character, not a default.

Consequences, all pinned in `powerset.test.ts`: a generated character totals identically in both
forms, carries no `OIHID` trait, and so the sheet offers it no Alternate Identity toggle — which
is right, as it has no second identity to toggle to.

### 1 — Generate the input, not the output

The single most important decision. `core/random` emits a `ParsedCharacter`; the existing
`heroDesignerCharacter.getCharacter()` turns it into a `Character`.

This buys everything downstream for free — costing, the sheet, the combat tracker, export,
persistence — because a generated character becomes **indistinguishable from an imported one**.
The alternative (emitting a finished `Character`) means reimplementing costing, and then
disagreeing with the engine about it.

### 2 — 250 is 5E, 400 is 6E

The legacy archetype data is 5E throughout: it has `com` (Comeliness, deleted in 6E) and
figured characteristics. These are different rulesets — different characteristic costs, no
figured stats in 6E — so this is an **edition fork, not a multiplier**.

#### A ceiling is a power level, not a number

This is the part that is easy to get wrong (and was, first time round). A build is a
**(base points, disadvantage/complication limit)** pair, and what the buckets spend is the
*sum*:

| Edition | Power level | Base | Limit | **Total spend** |
|---------|-------------|------|-------|-----------------|
| 5E | Low Powered Superheroic | 150 | 100 | **250** |
| 5E | Standard Superheroic | 200 | 150 | **350** |
| 6E | Low-Powered | 240 | 60 | **300** |
| 6E | Standard | 325 | 75 | **400** |

> ⚠️ **The two editions state their tiers differently.** This is the single easiest thing to get
> wrong here, and it has caught this document twice.
>
> ```
> 5E is quoted  base / disads         → ADD       150/100 → 250 total
> 6E is quoted  total / complications → SUBTRACT  400/75  → 325 base, 400 total
> ```
>
> So a 5E "150/100" and a 6E "400/75" are not the same kind of pair. Always reduce a tier to
> `(base, limit, total)` before reasoning about it, and never compare the quoted numbers
> directly.

**The legacy templates are 5E Low Powered Superheroic (150/100).** That is what makes them
internally consistent, and it is why they are a legal build rather than a sloppy one:

```
chars 100 + powers 125 + skills 25 = 250   ✓ every archetype
disadvantage packages              = 100   ✓ all four
```

Disadvantages/complications are taken at the **fixed limit** — in theory you may take fewer; in
practice nobody does — so the limit is a constant, not a variable to solve for.

**"250 or 400" — the original ask — is exactly 5E Low Powered and 6E Standard**, and both are
*totals*, so the two numbers are directly comparable. Those are the two levels to ship first.

The engine already handles both, and the fork is one string:

| Edition | `ParsedCharacter.template` | Serves |
|---------|----------------------------|--------|
| 5E      | `builtIn.Superheroic.hdt`   | Low Powered (250), Standard (350) |
| 6E      | `builtIn.Superheroic6E.hdt` | Low-Powered (300), Standard (400) |

Both ids are already resolved by `getTemplate` and golden-mastered (26 of the 37 fixtures use
one or the other). Emitting the right string drives `isFifth`, the characteristic set, and every
cost in the engine.

**Cost of this decision:** archetypes and powersets **per edition per power level**. Only one of
the four is free:

| Level | Total | Data |
|-------|-------|------|
| **5E Low Powered** | **250** | ✅ **ships** — lifted from legacy, as-is; needed no resizing |
| 5E Standard | 350 | ❌ not authored — archetypes + powersets would need resizing (+100) |
| 6E Low-Powered | 300 | ❌ not authored |
| **6E Standard** | **400** | ✅ **ships** — authored from scratch, benchmarked against the corpus |

The two in bold were the original ask, and **both are now done**. The machinery is shared — a
level is just a `(base, limit, template)` triple — so this was **content work, not
engineering**, and it was the bulk of the project. 5E Low Powered shipped first precisely
because its data already existed and was proven; 6E Standard is the one with real authoring
behind it (see "The Rule of X" below).

**The two unauthored levels are still in `POWER_LEVELS`, and they are a trap.** `rollRecipe`
throws for them rather than handing back an empty character, and `GenerateDialog` offers only
the two that have data — offering the others would be offering a crash. Anything that enumerates
`POWER_LEVELS` as if every entry were rollable is wrong.

**The edition fork is one string, and that is exactly why it is dangerous.** Both editions carry
the same eleven archetypes, the same eleven professions, the same four complication labels and
six of the same eleven powerset labels, so a lookup in the wrong edition **succeeds and returns
the wrong data**. Nothing may default the edition; `recipeEdition(recipe)` reads it off the
level, which is the only field that disambiguates a recipe at all. See
`core/random/__tests__/editions.test.ts`.

### 3 — Strict cutoffs as sub-budgets

Structured as the original was: a fixed allocation per bucket, with the line moving by archetype.
The legacy data already carries this and it is **real, not decorative** — the characteristics
budget is 100 for most archetypes, 125 for Patriot and Speedster, 150 for Brick; skillsets carry
their own `cost`. (The budget is now *computed* from each spread rather than declared — see
below.)

Each bucket is an independent sub-budget, which is what makes generation tractable: hitting a
250-point total by rolling dice and hoping is a bad search; hitting 100 points of characteristics
against a profile is not.

**The model is already latent in the legacy data.** `powers = total − chars − skills` reproduces
its powerset sizes exactly, which is strong evidence the cutoffs were the original's design too:

| Archetype | chars | balance | legacy powerset |
|-----------|-------|---------|-----------------|
| Energy Projector | 100 | 125 | **125** ✓ |
| Patriot | 125 | 100 | **100** ✓ |
| Speedster | 125 | 100 | **100** ✓ |
| Brick | 150 | 75 | **75** ✓ |

So the powerset flexes to fill whatever the balance is, which is also how the two corrected
archetypes absorb cleanly: Gadgeteer (93) takes a 132-point balance, Powered Armor (103) takes
122. **Confirmed in phase 2**, with a 25-point skillset: eight of the eleven need **zero** flex — the
legacy powersets are already exactly the right size. The three exceptions are all data, not
model:

| Archetype | Flex needed | Why |
|-----------|-------------|-----|
| Gadgeteer | **+7** | its spread costs 93 after the INT/EGO fix, not 100 |
| Powered Armor | **−3** | its spread costs 103, not the 100 its dropped label claimed |
| Martial Artist | **+10 / −15** | the only archetype whose two powersets disagree (115, 140) — and neither matches its 125 balance. A genuine slip; resolve when authoring |

### 4 — Legal by construction

Two different things get conflated under "legal":

- **Cost** — the engine computes it exactly. This is solved.
- **Rules** — the engine validates *nothing*. It will not tell you a characteristic breaches NCM,
  or that a multipower's slots exceed its reserve.

So: generate only from shapes that cannot be illegal, satisfy the budget by adjusting `levels`
within known-legal ranges, and add a thin validator for the few rules construction can't
guarantee. Prefer constraint satisfaction over random-and-reject.

### 5 — Seeded RNG is the correctness story

`core/random` is pure and takes the `Rng` port (already used by the dice roller, already
adaptered in `infra/rng`). Seeded generation is deterministic, so we can:

- pin specific generated characters in tests, and
- **fuzz**: generate thousands and assert every one is on-budget and legal.

That is a stronger guarantee than the corpus gives us anywhere else.

## The Rule of X — the balance oracle

`core/random/ruleOfX.ts` is Phil's own `Rule of X.xlsx` in code, weights and baselines intact.
HS6E2.282 describes the idea and, in his words, is "vague and hand-wavy"; the spreadsheet is his
attempt to make it workable. **It is the reason the 6E archetypes could be authored at all.**

**Points spent is not combat effectiveness.** Every archetype can total exactly 400 and still be
wildly out of line with the others. Nothing else in this system can tell a generated Speedster it
is too fast — the budget certainly can't, because it balances by construction.

Each stat scores `(character / baseline) × weight`; a character on the baseline scores exactly
100. The weights total 120, but DC and oAP are alternatives so 20 is never counted at once.
Phil's guidance, and the generator's test assertion: **within ±10%** (`TOLERANCE`).

Three things to know before authoring an archetype against it:

- **SPD and DC/oAP carry weight 20 each** — the heaviest in the model, with DCV 10 next. One point
  of SPD is worth four of CON. SPD is not flavour, and no real 400-point character in the corpus
  runs below SPD 5.
- **The dAP term is compound, not additive**: `DCV × DEF × rDEF × (dAP × weight)`. Resistant
  Protection raises DEF, rDEF *and* dAP, so it is effectively **cubic** — it caught four archetypes
  during authoring. This is true at the table: armour on something you can't hit is worth far more
  than armour on something you can.
- **The all-rounder trap.** An archetype with no identity stat (Patriot, Metamorph, Powered Armor)
  has nothing above baseline to trade, so being a shade *under* baseline anywhere is pure loss.
  Every failure during 6E authoring was in the spread, never the powerset.

`ruleOfXStats.ts` extracts the inputs from a built character. Two traps live there: it sets
`showSecondary: true` (or OIHID defences vanish) and reads HD's `template.type` for
ATTACK/DEFENSE rather than guessing.

**Two of Phil's rules are encoded in the data, not the engine** — don't "fix" them:
**no VPPs** ("character killers… multipowers are better for new players") and **no CSLs at
creation** ("re-invest those points into base OCV/DCV and keep the cognitive load lighter").
The second is why the 6E Weapons Master buys OCV 10 outright where its model character, Arrowhead,
runs CSL 3.

## Data model

```
core/data/random/
  archetypes.5e.json     # lifted from legacy public/templates/archtypes.json, with two
                         #   corrections: the derived characteristicsCost label dropped, and
                         #   the Gadgeteer's transposed INT/EGO un-swapped
  archetypes.6e.json     # authored fresh at 400
  powersets.5e.json      # authored: legacy prose -> {xmlid, levels, modifiers}
  powersets.6e.json      # authored fresh
  skillsets.json         # from legacy skills.json (professions + skills)
  complications.json     # from legacy disadvantages.json
  specialfx.json         # lifts as-is (16 strings, edition-agnostic)
```

### Archetype spreads are totals, and they check out

Legacy spreads state **totals** (`"str": 20`), while a `ParsedCharacter` stores `levels` — the
amount bought *above* base/figured. Generation therefore derives `levels` from the desired total
using the engine's own base and figured logic, rather than hardcoding a cost table.

Energy Projector's spread, worked through 5E costs by hand, lands **exactly** on its stated
`characteristicsCost: 100`:

```
STR 20 → 10 lv ×1 = 10     PD  6 → figured 4, buy 2 ×1  =  2
DEX 18 →  8 lv ×3 = 24     ED  4 → figured 4, buy 0     =  0
CON 20 → 10 lv ×2 = 20     SPD 4 → figured 2.8, +1.2×10 = 12
BODY 12 → 2 lv ×2 =  4     REC 10 → figured 8, buy 2 ×2 =  4
INT 18 →  8 lv ×1 =  8     END 50 → figured 40, 10 ×½   =  5
EGO 11 →  1 lv ×2 =  2     STUN 32 → figured 32, buy 0  =  0
PRE 15 →  5 lv ×1 =  5                                   ───
COM 18 →  8 lv ×½ =  4                        total     100
```

These were built by someone doing real 5E math. **Phase 1 verified that claim against the engine
for all 11** rather than trusting one hand-check — see the result below.

### Verified: the spreads are sound, two labels were not

Phase 1 result. All 11 archetypes hit **every characteristic in their spread exactly**, and 9 of
11 cost precisely what they claimed. Two labels were wrong — hand-summed, never checked:

| Archetype | Claimed | Actually costs | Why |
|-----------|---------|----------------|-----|
| `Gadgeteer` | 100 | **98** | vs Energy Projector: int 18→13, ego 11→18, rec 10→7, end 50→40 → `100 − 5 + 14 − 6 − 5` |
| `Powered Armor` | 100 | **103** | identical to Energy Projector but `stun: 35` vs `32`; STUN figures at 32, so +3 costs 3 |

**Resolved: the label is gone.** `characteristicsCost` has been dropped from all 11 entries. The
spread *is* the character; its cost is **derived, not declared** — and a hand-maintained number
sitting next to a computable one is exactly how these two drifted. The generator asks the engine.

**Resolved: the Gadgeteer's INT/EGO was a transposition.** Legacy had `int 13 / ego 18` — the
exact mirror of Energy Projector's `int 18 / ego 11`, and an odd build for a gadgeteer. Un-swapped.
Note this *moves* its cost again: +5 for the INT, −10 for the EGO, so **93**, not the 98 above.

The characteristics budget per archetype is therefore:

| 100 | 125 | Other |
|-----|-----|-------|
| Energy Projector, Martial Artist, Mentalist, Metamorph, Mystic, Weapons Master | Patriot, Speedster | Gadgeteer **93**, Powered Armor **103**, Brick **150** |

Not flat, by design — the attribute line moves per archetype, as it did in the original. The
allocator spends against these; the balance flows to powers. Pinned as a table in
`core/random/__tests__/characteristics.test.ts`, so editing a spread fails loudly rather than
silently reshaping an archetype.

## Phasing

- [x] **Phase 1 — characteristics slice (5E).** *(done)* `archetypes.5e.json` lifted;
      `core/random/characteristics.ts` builds a characteristics-only `ParsedCharacter` per
      archetype and the engine costs it. All 11 hit their spreads exactly; 9 of 11 match their
      stated cost, and the two that don't are the data's fault, not the engine's (see above).
      The pipeline is proven and the 250-point spreads are safe to build on.
- [x] **Phase 2 — allocator.** *(done)* `core/random/powerLevel.ts` (the four levels, reduced to
      `(base, limit, total)` triples) and `core/random/allocate.ts` (cutoffs as sub-budgets;
      powers take the balance; complications fixed at the limit). Seeded-`Rng` selection, fuzzed
      over 2000 budgets. Confirmed the model reproduces the legacy powerset sizes: **8 of 11
      archetypes need zero flex**. The required flex per powerset is pinned as the phase 3
      authoring spec.
- [x] **Phase 3 — 5E powersets + skills + complications.** *(done)* Every archetype has a
      structured powerset, and each costs its balance **exactly**, checked automatically for all
      of them. All four complication packages total exactly the 100-point limit, and all eleven
      skillsets total exactly 25. **A generated character spends its full 250.**
- [x] **Phase 4 — 6E Standard (400).** *(done)* The other half of the original ask: eleven
      archetypes, eleven powersets, eleven 50-point skillsets and four 75-point complication
      packages, all authored fresh against the Rule of X and the five real 400-point characters in
      the corpus. Every roll lands inside ±10%. 5E Standard (350) and 6E Low-Powered (300) remain
      data-not-code if ever wanted.
- [x] **Phase 5 — UI.** *(done)* `GenerateDialog` — edition pills, a 3s hold, a reveal, and
      "Roll Again". The power-level picker arrived with the second level that had data, as
      predicted. `CharacterEditor` covers the editable fields and the Player-Defined skills.

### Proven: prose → structured, priced by the engine

Energy Projector's first powerset, authored from the legacy strings and costed end to end.
**No cost is stated anywhere in the data** — every number is derived:

| Legacy prose | Structured | Active | Real |
|--------------|-----------|--------|------|
| `Armor +5 rPD +5 rED`, 15 | `ARMOR levels 10, pd 5, ed 5` | 15 | **15** |
| `Multipower`, 50 | `powers.multipower` → `GENERIC_OBJECT basecost 50` | 50 | **50** |
| `EB 10d6`, `5u` | `ENERGYBLAST levels 10, ultraSlot` | 50 | **5** |
| `Entangle 5d6 DEF 5`, `5u` | `ENTANGLE levels 5, ultraSlot` | 50 | **5** |
| `Force Wall 10 rPD 10 rED`, `5u` | `FORCEWALL pd 10, ed 10, ultraSlot` | 50 | **5** |
| `EC [Energy]`, 15 | `powers.elementalControl` → `GENERIC_OBJECT basecost 15` | 15 | **15** |
| `1) Flight 10", 8x NCM`, 15 | `FLIGHT levels 10` + `IMPROVEDNONCOMBAT levels 2` | 30 | **15** |
| `2) FF +10/+10, No END (+1/2)`, 15 | `FORCEFIELD pd 10, ed 10` + `REDUCEDEND` | 30 | **15** |
| | | | **125** ✓ |

The `5u` and the elemental-control discount are **derived, not written**: `multipowerItem`
divides active by 10 for an ultra slot, and `elementalControlItem` subtracts the reserve. That
is the whole point of authoring the shape rather than the arithmetic — the engine is the
oracle, and the allocator's balance is the check.

Rendered end to end it reads as a real character: 8 power rows with rulebook definitions,
`PD 21/15` (base 6 + Armor 5 + Force Field 10, of which 15 resistant), and the archetype's
characteristics intact underneath.

**Sloppy is allowed, but it must be declared.** The legacy prose is loose in places, and being
faithful to it beats inventing precision the original never had — so a powerset may carry an
`approximations` list naming each knowingly-wrong corner and why. `approximations()` flattens
every one across the data for review, and a test pins the list, so a new fudge fails until
somebody writes down what they did. **Currently empty** — the Energy Projector translates
exactly.

> The Force Wall's `lengthlevels: 0` looked like a fudge and is not: those levels buy extent
> **above the base 2m × 2m wall**, so 0 is the base-size wall — real and legal, not a wall with
> no extent. Its 50 active points are pure defence (10 rPD + 10 rED), exactly what the prose
> priced at `5u`. Worth knowing before the same reflex fires on the other ten archetypes.

**What the authoring actually costs**, learned the hard way on this one — the shape is the
work, not the cost:

- A power carries **both** `levels` *and* its split (`pdlevels`/`edlevels`). `levels` is what
  prices; the split is descriptive. Omit `levels` and the power silently costs 0.
- `FORCEWALL` routes to the `Barrier` decorator, which reads `lengthlevels`, `heightlevels`,
  `bodylevels` and `widthlevels`. Omit them and the cost is `NaN`, not an error.
- `name` supplies the sheet label; `alias` does not.

### The remaining seven are not mechanical

Energy Projector was the simplest case in the set, and calling the rest "mechanical" was wrong.
Two things make them harder:

**1. Five powersets do not sum to their own stated total.** *(three now resolved)* Pinned in
`allocate.test.ts`. For these, *neither* number is trustworthy — the listed powers and the
`powersCost` disagree, so authoring one means first deciding which is wrong:

| Powerset | Listed sum | States | Δ | Read |
|----------|-----------|--------|---|------|
| `Brick [0]` | 95 | 75 | +20 | ✅ **Resolved.** `Flight 10", 8x NCM` is listed at 35; in a 15-point EC it is 30 active − 15 = **15**, and at 15 the powerset sums to exactly 75. Authored at 15 |
| `Speedster [1]` | 110 | 100 | +10 | ✅ **Resolved.** `Desolid` is listed at 35; Desolidification's basecost is 40, so 40 − 15 = **25**, and at 25 it sums to exactly 100. Authored at 25 |
| `Patriot [1]` | 102 | 100 | +2 | needs a call |
| `Brick [1]` | 65 | 75 | −10 | needs a call |
| `Martial Artist [1]` | 115 | 140 | −25 | ✅ **Resolved.** Its stated 140 is simply wrong: both its powersets carry identical content, and both sum to 115 (powers **exactly 100** + maneuvers **exactly 15**). See below |

Both resolved typos were **the same error** — an elemental-control slot priced as if it were
standalone — which is worth knowing when the remaining three are looked at.

**1b. ~~Patriot is blocked by an engine bug~~ — resolved.** Its powerset priced `ES: PER +1` at 3
while the engine said 1: Enhanced Perception ignored the template's `allcost`. Fixed as **H9**
(`docs/KNOWN_DEVIATIONS.md`); `adamantine` was mispriced by it too (9 where the rules say 27).
Patriot is now authored and costs its balance exactly. Worth noting the archetype prose was
independent evidence for that fix — written a decade ago, it prices a +1 to all senses at 3,
siding with the template against the code.

**2. ~~One structural gap~~ — resolved.** `Powerset` now carries an optional `martialarts` block
alongside `powers`, and `attachPowerset` fills its `.hdc` boilerplate the same way.

**The maneuvers' cost was folded into `powersCost`** (Phil's hypothesis, and the arithmetic is
exact): Martial Artist's stated 115 is **powers 100 + maneuvers 15**, in *both* its powersets.
Powers landing on precisely 100 — the same round number Patriot and Speedster get — is what
confirms it. So maneuvers live in the `martialarts` bucket but their cost counts against the
**powers** balance, and the balance check sums both.

A maneuver is `xmlid: 'MANEUVER'` with its **cost as `basecost`** on the trait (tazimmaad's "Cut"
is `basecost: 3`); `populateTrait` derives the real xmlid from its `display`. Nothing reads the
maneuver template for cost.
- ~~**`Multiform: 250 Points`.**~~ ✅ **Resolved: dropped.** `Metamorph [2]` is the only powerset
  that uses it, and a Multiform references *another whole character* — a recursive generation
  problem far out of proportion to one powerset out of 37. Metamorph keeps its other three
  ([0] Density Increase, [1] Growth, [3] Shape Shift).

The rest of the vocabulary is confirmed to exist in the 5E template and priced: `EGOATTACK`,
`MINDCONTROL`, `TELEPATHY`, `MENTALILLUSIONS` (plural), `CLINGING`, `INVISIBILITY`, `TUNNELING`,
`DENSITYINCREASE`, `GROWTH`, `SHAPESHIFT`, `STRETCHING`, `HANDTOHANDATTACK`, `TELEPORTATION`,
`MISSILEDEFLECTION`, `KBRESISTANCE`, `DESOLIDIFICATION`, `DARKNESS`, `ENHANCEDPERCEPTION`,
`LIFESUPPORT`. `STR`/`RUNNING`/`LEAPING` are **characteristics**, so they live under
`powers.str` etc. and are priced by the `Characteristic` decorator.

### Resolved: the Warrior skillset was a data error

`Warrior` stated 28 where every other skillset states 25 — the only one that did. At 28 it fits
nothing: `100` characteristics `+ 125` powerset `+ 28` skills is 253, not 250, for *every*
archetype, in this data and the legacy data alike. **Corrected to 25** (Phil). All eleven
skillsets now cost 25, so every one can be rolled.

`fittableSkillsets()` stays as a guard rather than being deleted: a future skillset that does not
cost 25 should be dropped from the roll loudly there, not silently produce a character that
misses its total.

> **This number is still declared, not derived** — the same shape as the `characteristicsCost`
> labels that turned out to be wrong twice. Skills are name strings today, so nothing computes
> the cost. When phase 3 structures them, `cost` should be **dropped** and computed from the
> skills themselves, exactly as the archetype spreads now are. Worth flagging: Warrior's list
> carries `CSL: HTH Combat +1` and `Defense Maneuver`, which are dearer than ordinary skills in
> 5E — so its real cost may well not land on 25, and that is a conversation for when the engine
> can price it rather than a number to keep hand-maintaining.

## Skills and complications — ✅ done

The last 25 (skills) and 100 (complications) of a Low Powered build; 50 and 75 in 6E.
Complications were the cleaner half; the skills blockers below are all resolved, and the section
is kept for the reasoning rather than as a plan.

### Complications — ✅ done

Four packages in `complicationPackages.5e.json`, **each totalling exactly the 100-point limit**,
priced entirely from their adders — no cost is stated in the data. Every generated character now
carries one, and a fuzz asserts all 40 rolls take exactly `level.limit`.

A disadvantage's cost is the **sum of its adder basecosts**; the description lives in `input`,
and `optionid` is recorded for fidelity but does not price. So
`PsyL: Code Of The Hero (Very Common/Strong)` is `SITUATION` 15 + `INTENSITY` 5 = 20.

Two things worth knowing for the 6E port:

- **Normal Characteristic Maxima is `xmlid: NCM`**, and it is *not* one of the template's 16
  disadvantage kinds — it carries its 20 as a plain `basecost` with no adders.
- The `Hunted: Government Agency (More Powerful/NCI/Watch)` entry is the shape to copy when a
  cost looks impossible: More Powerful (15) + NCI (5) **− Watching (10)** nets back to the
  prose's 10. A negative adder, not an error.

### Skills — three blockers, all resolved

**1. It is not one bucket, it is four.** The prose's "skills" is a catch-all over 51 distinct
strings: **41 skills, 4 skill levels, 3 perks** (`Money: Well Off`, `FB: Medical License`,
`FB: Member of the Aristocracy`) and **3 talents** (`Lightning Reflexes`, `Defense Maneuver`,
`Eidetic Memory`). Perks belong in `perks`, talents in `talents` — so `Powerset` needs those
buckets the way it just gained `martialarts`.

**2. ~~Some strings are damaged~~ — resolved (Phil):**

| String | Where | Resolution |
|--------|-------|------------|
| `Lang:` | Playboy/Socialite, Royalty, Soldier, Spy | Default the `input` to **"Player Defined"** |
| `SS[INT]:` | Scientist (×3) | Default the `input` to **"Player Defined"** |
| `CSL: HTH Combat +1 or Ranged combat +1` | Warrior, Investigator | **Resolve the `or` per profession** — pick the one that fits, so the player is not asked to choose |

**3. Skills price unlike anything else here** — findings from a first attempt, so the next one
starts here rather than rediscovering them:

- A skill carries its **`basecost` on the trait**, as everything else in this data does. A full
  3-point skill is `basecost: 3`; the template carries no cost at all.
- **A skill's own `levels` is the +2-per-level lever** (Phil's rule). `DEMOLITIONS` at `levels: 1`
  costs 5 = 3 + 2. This is *not* a `SKILL_LEVELS` trait.
- **`SKILL_LEVELS` is a different thing** — a level across *several* skills, priced by its option:
  `CHARACTERISTIC` 2, `SINGLEMOVEMENT` 2, `ALLMOVEMENT` 3, `RELATED` 3 ("any three related
  Skills"), `SIMILAR` 5 ("a group of similar Skills"), `NONCOMBAT` 8, `OVERALL` 10.
- **Skill levels live in the `skill` array**, not a `skillLevels` sub-key. Unlike powers, nothing
  folds a skills sub-key in: `populateTrait` reads only `skill` and `list`, plus the skill
  *enhancers* (`linguist`, `scientist`, `scholar`, `jackOfAllTrades`, `traveler`), which it pushes
  in by name. **A `skillLevels` sub-key is silently dropped** — costing 0, not erroring.

**~~The blocker~~ — resolved (Phil).** The levers are wider than `levels`:

| Lever | Cost | Effect |
|-------|------|--------|
| Familiarity | **1** | roll becomes a flat 8- |
| Proficiency | **2** | roll becomes a flat 10- |
| Full skill | **3** | the normal roll |
| `levels` on a skill | **+2** each | +1 to that skill's roll |

Familiarity and Proficiency are what close an **odd** remainder — `levels` alone moves in 2s.
`Actor/Actress` is 26 as listed (7 skills at 3, plus `SL: Interactive Skills +1` = a `SIMILAR`
group level at 5), so Seduction drops to a Proficiency and it lands on **25**. The engine
independently produces the flat `10-` roll, confirming the rule against the data.

**A skill needs its `characteristic`** (`PRE`, `INT`, …) or it has **no roll** — silently, not as
an error, so the sheet would show a blank roll column. Actor/Actress rolls 12-/13- off PRE and
INT once it is set.

**All 11 authored, each exactly 25.** How they landed:

| Outcome | Sets | What it took |
|---------|------|--------------|
| **25 as listed** | Playboy/Socialite, Royalty, Soldier, Spy | nothing — once `Lang:` is read as a 2-point **Fluent** |
| **26 → one Proficiency** | Actor/Actress, Entrepreneur, Investigator, Technician, Scientist | −1, an odd remainder only Familiarity/Proficiency can close |
| **27 → one Familiarity** | Physician, Warrior | −2 |

Four landing on 25 dead with `Lang:` = Fluent (2) is good evidence that is what it always meant.

**The Warrior question is settled.** Its 28 was corrected to 25 on the reading that it was a typo,
and structuring tested that: its content *really is* dearer — a 5-point CSL, Defense Maneuver, and
Lightning Reflexes — and it reaches 25 only by dropping Concealment to a Familiarity. The 25
holds, but only just, which is presumably why someone once wrote 28.

**Two more silent-zero traps**, both the same class as the `skillLevels` sub-key:

- **`NAVIGATION` cannot be a Familiarity or Proficiency.** It routes to `SkillWithAdders`, which
  overrides `cost()` and ignores both flags — it is always 3. Physician's flex had to move to
  Forensic Medicine.
- **A skill needs `name: null`, not a missing `name`** — the sheet renders the literal
  `"undefined (Acting)"` otherwise. And `COMBAT_LEVELS`/`SKILL_LEVELS` need an **`optionAlias`**
  (`"with Ranged Combat"`), or the row reads `+1 undefined`.

**4. `cost: 25` is declared, and structuring will test it.** Same shape as `characteristicsCost`,
which was wrong twice, and as `Warrior`'s 28 — corrected to 25 on the reading that it was a typo.
Once the engine can price a skillset, that reading gets checked: **Warrior's list carries
`CSL: HTH Combat +1` and `Defense Maneuver`, both dearer than an ordinary 3-point skill**, so its
content may genuinely come to 28 and the correction may need revisiting. Expect structuring to
surface discrepancies in several of the eleven, exactly as it did for the archetype spreads.

Once priced, `cost` should be **dropped** and derived, as `characteristicsCost` was.

## Editable fields — ✅ done

A generated character is a starting point, not a finished one, so some of it is the player's to
change (`app/screens/CharacterEditor.tsx`):

- **Name**, **Archetype**, **special effect**, **Profession** (the skillset)
- The **"Player Defined"** skills — `Lang:` and `SS[INT]:` exist precisely so the player names
  their own language and sciences, so they must be editable or the default is a dead end.

The predicted shape held: editing the archetype or profession re-rolls the build (and nags first),
while editing a name or a Player-Defined input does not. Only `origin: 'generated'` rows are
editable at all — an imported `.hdc` is the player's file and stays read-only.

Two things the implementation settled:

- **A player's answer lives on the recipe**, not on the built character. A rebuild regenerates the
  skills bucket from the tables, so an answer kept anywhere else would be erased by the next
  re-roll. Slots are keyed `XMLID#ordinal` (`LANGUAGES#0`) rather than by trait id, so an answer
  survives a profession change — every set's `LANGUAGES#0` is the same question.
- **"Did the player choose this name?"** needs no stored flag: ask whether the current name is
  still exactly what the current recipe would auto-generate. Renaming a character to precisely
  "Fire Brick" makes it auto again, which is a harmless thing to be wrong about.

## Rolling — ✅ done

`app/screens/GenerateDialog.tsx`. Edition pills, a 3s hold, then the reveal:

```
choosing  edition pills          [Cancel] [Generate]
rolling   a bar, for 3s flat     [Cancel]
revealed  "You are an Ice ..."   [Roll Again] [View]
```

**Nothing is written until "View".** Rolling and keeping are separate provider actions (`roll` is
pure and synchronous; `keep` is the only write) because "Roll Again" over a save-on-roll would
have littered the library with rejected characters.

The reveal sentence has rules the tables don't (`core/random/describe.ts`): `a`/`an`, the
slash-pair professions ("Playboy/Socialite" → "Socialite"), and `Other` — a real 1-in-16 roll that
names the *absence* of an effect and so is never printed, in the sentence or the auto-name.

## Open questions

- ~~**Archetype spreads vs spending profiles.**~~ **Resolved: spreads, hand-authored.** The
  question was whether a *profile* (weights, floors, caps — "Brick: STR dominant, SPD ≥ 4") could
  serve any ceiling and save authoring a second set of eleven for 6E. It could not, and the reason
  is worth keeping: **6E figures nothing.** In 5E, PD/ED/SPD/REC/END/STUN fall out of STR/CON/DEX
  and OCV/DCV come off DEX; in 6E every one of them is bought outright. The two editions' spreads
  are not the same shape scaled — they have different *fields*. A profile general enough to emit
  both would have been a second engine. The Rule of X is what a profile was really reaching for,
  and it grades rather than generates.
- ~~**Complications/disadvantages.**~~ **Resolved:** taken at the fixed limit, always. The four
  power levels and their arithmetic are in the table above.
- ~~**Which levels ship?**~~ **Resolved: 5E Low Powered (250) and 6E Standard (400)** — the
  original ask, both done. `5e-standard` and `6e-low` remain in `POWER_LEVELS` unauthored;
  `rollRecipe` throws for them and the dialog does not offer them.
- **Name generation.** Legacy left `name: ''`. Still out of scope: a roll is named
  "Ice Powered Armor" (its effect and archetype), which is a label rather than a name, and the
  player can type over it.
- **5E Low Powered has no Rule of X campaign.** `CAMPAIGN_225` is the nearest sample and 250 is
  not 225, so the 5E archetypes — lifted from legacy prose — have never been graded. They are
  legal and on-budget; whether they are *balanced against each other* is unmeasured.
- **The Scientist skill enhancer is omitted.** Noted during authoring, not fixed.
