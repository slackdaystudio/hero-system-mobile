# Random Character Design

> Design spec for the reimagined random character generator (`core/random`). Written after
> auditing the legacy `RandomCharacter.js` and its four `public/templates/*.json` data files.
> Companion to `REBUILD_PLAN.md`, which dropped the legacy generator from the port on the
> grounds that it would be redesigned rather than carried over. This is that redesign.

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
| **5E Low Powered** | **250** | ✅ lifted from legacy, as-is — needs no resizing |
| 5E Standard | 350 | archetypes + powersets resized (+100) |
| 6E Low-Powered | 300 | authored from scratch |
| **6E Standard** | **400** | authored from scratch |

The two in bold are the original ask. The machinery is shared — a level is just a
`(base, limit, template)` triple — so this is **content work, not engineering**, and it is the
bulk of the project. Ship 5E Low Powered first precisely because its data already exists and is
proven; 6E Standard is the one with real authoring behind it.

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
- [ ] **Phase 3 — 5E powersets + skills + complications.** *(10 of 11 archetypes)* Author the
      legacy prose as structured data, flexing each to its balance — see `REQUIRED_FLEX` in
      `allocate.test.ts`. Every authored powerset costs its balance exactly, checked
      automatically. **Only `Martial Artist` is left**, and it is blocked: its Martial
      Block/Disarm/Dodge/Throw are `martialarts` traits, not powers, and the `Powerset` shape has
      no bucket for them — plus its two powersets state 115 and 140 against a 125 balance, so
      neither number is trustworthy. Skills and complications are still name strings.
- [ ] **Phase 4 — 6E Standard (400).** The other half of the original ask; archetypes and
      powersets authored fresh. 5E Standard (350) and 6E Low-Powered (300) follow if wanted —
      each level is a `(base, limit, template)` triple over the same machinery, so they are data,
      not code.
- [ ] **Phase 5 — UI.** *(preview shipped)* A **Generate** action sits beside Import in the
      Characters header: it rolls one of the authored archetypes, saves it through
      `characterRepository` exactly as an import does, and opens it on the normal sheet. It says
      what it built (`225 of 250 — skills and complications aren't generated yet`) rather than
      implying a finished character. Still to come: the power-level picker, once more than one
      level has data.

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

**1. Five powersets do not sum to their own stated total.** Pinned in
`allocate.test.ts`. For these, *neither* number is trustworthy — the listed powers and the
`powersCost` disagree, so authoring one means first deciding which is wrong:

| Powerset | Listed sum | States | Δ | Read |
|----------|-----------|--------|---|------|
| `Brick [0]` | 95 | 75 | +20 | ✅ **Resolved.** `Flight 10", 8x NCM` is listed at 35; in a 15-point EC it is 30 active − 15 = **15**, and at 15 the powerset sums to exactly 75. Authored at 15 |
| `Speedster [1]` | 110 | 100 | +10 | ✅ **Resolved.** `Desolid` is listed at 35; Desolidification's basecost is 40, so 40 − 15 = **25**, and at 25 it sums to exactly 100. Authored at 25 |
| `Patriot [1]` | 102 | 100 | +2 | needs a call |
| `Brick [1]` | 65 | 75 | −10 | needs a call |
| `Martial Artist [1]` | 115 | 140 | −25 | needs a call — and its sibling `[0]` states 115 against a 125 balance, so this archetype is doubly adrift |

Both resolved typos were **the same error** — an elemental-control slot priced as if it were
standalone — which is worth knowing when the remaining three are looked at.

**1b. ~~Patriot is blocked by an engine bug~~ — resolved.** Its powerset priced `ES: PER +1` at 3
while the engine said 1: Enhanced Perception ignored the template's `allcost`. Fixed as **H9**
(`docs/KNOWN_DEVIATIONS.md`); `adamantine` was mispriced by it too (9 where the rules say 27).
Patriot is now authored and costs its balance exactly. Worth noting the archetype prose was
independent evidence for that fix — written a decade ago, it prices a +1 to all senses at 3,
siding with the template against the code.

**2. One structural gap** left, now that Multiform is dropped:

- **Martial maneuvers.** `Martial Artist` lists `Martial Block`/`Disarm`/`Dodge`/`Throw` as part
  of its powerset. Those are `martialarts` traits, not powers — a `.hdc` carries them in their
  own trait bucket. `Powerset` would need to carry `martialarts` alongside `powers`.
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

## Open questions

- **Archetype spreads vs spending profiles.** Fixed spreads are what the legacy data gives us and
  they lift for free at 250. But a *profile* (weights, floors, caps — "Brick: STR dominant,
  SPD ≥ 4") would let one archetype definition serve any ceiling, instead of hand-authoring a
  second set of eleven for 6E. Phase 1 uses the spreads as-is; revisit before Phase 4, which is
  where the duplication would otherwise bite.
- ~~**Complications/disadvantages.**~~ **Resolved:** taken at the fixed limit, always. The four
  power levels and their arithmetic are in the table above.
- **Which levels ship?** All four are nearly free in machinery but each needs its own archetype
  and powerset data. 5E Low Powered is done and proven; the other three are authoring.
- **Name generation.** Legacy left `name: ''`. Out of scope for now.
