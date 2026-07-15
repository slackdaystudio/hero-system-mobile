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
| 1 | Output shape | Generate a **`ParsedCharacter`** — the `.hdc`-shaped *input* — not a finished character |
| 2 | 250 vs 400 | **Two editions**: 250 = 5E, 400 = 6E. Not a scaling knob |
| 3 | Power generation | **Curated shapes, random selection.** Structured powersets per archetype; flex `levels` to fit |
| 4 | Legality | **Legal by construction**, engine as the cost oracle, thin validator for the rest |
| 5 | Randomness | Via the existing `Rng` port — seedable, therefore testable and fuzzable |
| 6 | Persistence | None new. A generated character saves through `characterRepository`, exactly as an import does |

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
| 6E | Low-Powered | 300 | 60 | **360** |
| 6E | Standard | 400 | 75 | **475** |

**The legacy templates are 5E Low Powered Superheroic (150/100).** That is what makes them
internally consistent, and it is why they are a legal build rather than a sloppy one:

```
chars 100 + powers 125 + skills 25 = 250   ✓ every archetype
disadvantage packages              = 100   ✓ all four
```

Disadvantages/complications are taken at the **fixed limit** — in theory you may take fewer; in
practice nobody does — so the limit is a constant, not a variable to solve for.

> **Pick power levels in the UI, not point numbers.** "250 or 400" mixes conventions: 250 is a
> *total* (5E Low Powered) while 400 is a *base* (6E Standard, which spends 475). Naming the
> level instead of the number removes the ambiguity — the user chooses "6E Standard" and the
> arithmetic follows from the table. Point totals are shown, not typed.

The engine already handles both, and the fork is one string:

| Edition | `ParsedCharacter.template` | Serves |
|---------|----------------------------|--------|
| 5E      | `builtIn.Superheroic.hdt`   | Low Powered (250), Standard (350) |
| 6E      | `builtIn.Superheroic6E.hdt` | Low-Powered (360), Standard (475) |

Both ids are already resolved by `getTemplate` and golden-mastered (26 of the 37 fixtures use
one or the other). Emitting the right string drives `isFifth`, the characteristic set, and every
cost in the engine.

**Cost of this decision:** archetypes and powersets **per edition per power level**. Only one of
the four is free:

| Level | Total | Data |
|-------|-------|------|
| 5E Low Powered | 250 | ✅ lifted from legacy, as-is — needs no resizing |
| 5E Standard | 350 | archetypes + powersets resized (+100) |
| 6E Low-Powered | 360 | authored from scratch |
| 6E Standard | 475 | authored from scratch |

The machinery is shared — a level is just a `(base, limit, template)` triple — so this is
**content work, not engineering**, and it is the bulk of the project. Ship 5E Low Powered first
precisely because its data already exists and is proven.

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
122. Worth a look in phase 2: `Martial Artist` states 115 where the balance implies 125.

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
- [ ] **Phase 2 — allocator.** Cutoffs as sub-budgets; flex `levels` to land on the ceiling
      exactly. Fuzz with a seeded `Rng`.
- [ ] **Phase 3 — 5E powersets + skills + complications.** Author the legacy prose as structured
      data. The bulk of the 250-point work.
- [ ] **Phase 4 — the other power levels.** 5E Standard (350) resizes the existing archetypes and
      powersets; 6E Low-Powered (360) and Standard (475) are authored fresh. Each level is a
      `(base, limit, template)` triple over the same machinery, so this is data, not code.
- [ ] **Phase 5 — UI.** Power-level picker (named levels, not typed numbers) → generate → save.
      The screen is thin; everything real happens in `core/random`.

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
