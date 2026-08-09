# Character Authoring — feasibility analysis

> What it would take to author a character sheet inside the app, rather than importing one.
> Companion to [`RANDOM_CHARACTER.md`](RANDOM_CHARACTER.md) and [`PERSISTENCE.md`](PERSISTENCE.md).
> **Phase 0 and Phase A are built** (see the phasing table); the rest is still analysis. Every
> empirical claim below was measured against the tree, not read off the code.

## The headline

**The engine half is already done.** `getCharacter` prices a hand-built character correctly today,
the full HERO Designer rules catalogue already ships in the binary, and the save path already
exists. What is missing is an *input* model and the UI over it.

The strongest evidence is that **authoring already happens in this repo, by hand, in production**:
`core/data/random/powersets.6e.json` is hand-written `.hdc`-shaped trait JSON, and the generator
runs it through the same engine a real import uses. An authoring feature is that file, made by a
person tapping a screen instead of by Phil typing JSON.

Per the brief, `.hdc` XML **write-back is out of scope** — the authoring source is stored as JSON in
the app's own schema, reusing HD's `xmlid`/field vocabulary for consistency. That removes an entire
XML-writer workstream and the round-trip fidelity problem that comes with it.

## Proof the engine already does its half

A `ParsedCharacter` assembled from scratch (no `.hdc`, no fixture) and run through
`heroDesignerCharacter.getCharacter()` + `characterTraitDecorator`:

| Authored input | Engine output | Correct? |
|---|---|---|
| `STR` 20 levels, 6E Superheroic | value 30, cost 20 | ✅ |
| Blast 10 levels + `AOE` Radius 8m | base 50, **active 75**, real 75 | ✅ 50 × 1.5 |
| `ACROBATICS`, 0 levels | cost 3, roll `11-` | ✅ DEX 10 → 11- |
| `ACROBATICS` +2 levels, named "Tumbling" | cost 7, label `Tumbling (Acrobatics)` | ✅ |
| Psych Complication + `SITUATION` Common + `INTENSITY` Strong | cost 20 | ✅ 10 + 10 |

Nothing had to change in `core/` to get those numbers. The pricing, rolls, labels, advantage
multipliers and adder summation all work on hand-built input.

## What already exists

| Asset | Where | Note |
|---|---|---|
| Rules catalogue, both editions | `core/data/herodesigner/` (1.2 MB) | **477** authorable entries in 5E, **409** in 6E |
| Form metadata for those entries | same | see below — HD's own UI hints ship with the data |
| Trait pricing for every family | `core/traits/` | 66 decorators, 37 of them power-specific |
| Hand-authored trait JSON, proven | `core/data/random/*.json` | the authoring data model, already in production |
| Build → price → save pipeline | `GenerateProvider.keep` / `.revise` | `getCharacter` → `characters.save({origin, recipe})` |
| Editable-vs-read-only provenance | migration 005 (`origin`, `recipe`) | imports stay read-only; the gate already exists |
| Cost summation primitive | `allocate.ts` `skillsBudget` | sums decorated `realCost()` per category |
| Form controls | `app/components/` | `TextField`, `NumberField`, `SelectField`, `SegmentedControl` |

### The templates already carry HD's form metadata

This is the single biggest lever, and it is easy to miss. The `.hdt` entries are not just costs —
they are the field definitions HERO Designer builds *its* dialogs from. Counting 6E only:

```
option=61  adder=92  inputlabel=49  minval=75  levelstart=75
mincost=102  maxcost=29  maxval=5  optionlabel=6  levelslabel=2
exclusive / excludes  (adder mutual-exclusion, e.g. PLUSONEPIP vs PLUSONEHALFDIE)
```

`AOE` alone declares five `option`s (Radius/Cone/Line/Surface/Any), each with its own
`lvlmultiplier` and its own nested adders, plus four shared adders with exclusion rules. A
generic renderer over this metadata gets you most of the authoring UI for free, in both editions,
with no per-power code.

**But not all of it.** The ~37 power decorators read fields the templates never declare —
`pdlevels`/`edlevels` (Resistant Protection), `ultraSlot`, `input`, `optionid`. Those need a
hand-written field map per power family. That long tail is the honest bulk of the UI work.

## What's missing

### 1. Persistence must store the authoring *source*

The stored `document` is `getCharacter`'s **output**, not its input. Re-opening an editor needs the
input back, and the output does not round-trip:
`populateMovementAndCharacteristics` keeps exactly nine fields per characteristic
(`type, name, shortName, value, cost, base, definition, roll, ncm`) and discards the parsed entry —
so any adder or modifier on a characteristic is gone. Levels are recoverable (`value − base`);
everything else is not.

Generated characters already dodge this by storing the **recipe** in its own column and rebuilding.
Authored characters need the same move, one level lower: store the `ParsedCharacter` itself.

```sql
-- migration 008
ALTER TABLE characters ADD COLUMN source TEXT;   -- ParsedCharacter JSON; NULL for imports
-- origin gains a third value: 'imported' | 'generated' | 'authored'
```

`origin: 'authored'` slots straight into the existing editability gate (`editableRecipe`'s pattern).
Note the interchange consequence: an authored character shared as `.hsmc` would carry the document
but not the source, so it would arrive read-only. That is defensible (it matches how an import
behaves) but should be a decision, not an accident. *(No `.hsmc` export is implemented today.)*

### 2. A `ParsedCharacter` emitter — `core/authoring/`

Pure core, no RN, mirroring `core/random/`'s discipline. This is where the real work is, and it has
to synthesize several things the engine consumes but does **not** derive. Each of these was hit
empirically:

- **`alias` and `optionAlias` are author-supplied display strings.** The engine reads them
  (`modifiers/modifier.ts:99`, `characterTrait.ts:101`, `skillLevels.ts:36`) and never derives them
  from the template. The generator's authored JSON writes them by hand. An authoring UI must
  synthesize them from the template's `display` plus the selected option.
- **`name: null` is required, not optional.** A trait with `name` *absent* renders its label as the
  literal string `"undefined (Acrobatics)"`. The `.hdc` parser supplies it via xml2js
  `emptyTag: null`; a hand-built object has to do it deliberately.
- **Every trait category key must be present.** `powers: {...}` with `perks` merely `undefined`
  throws `Cannot read properties of undefined (reading 'perk')` in `populateTrait` — the function
  guards `null` but not `undefined`. All seven categories must be emitted, `null` when empty.
- **Frameworks are identified by their sub-key, not their xmlid.** A Multipower is
  `XMLID="GENERIC_OBJECT"` under a `multipower` sub-key; `normalizeCharacterItems` turns the sub-key
  into `originalType`. Emitting `xmlid: 'MULTIPOWER'` produces a container the engine does not
  recognise.
- Stable `id`s, `position` ordering, and `parentid` wiring for framework slots.

### 3. Validation the engine does not perform

`getCharacter` prices; it does not judge legality. Two silent failure modes, both already documented
as having shipped bugs, and both confirmed here:

- **An xmlid the edition lacks resolves to no template and prices at 0**, reading as authored.
  `LACKOFWEAKNESS`, `SEDUCTION`, `AREA_KNOWLEDGE`, `LIGHTNING_REFLEXES_SINGLE` all did this. In the
  app it is worse than silent: a bogus xmlid makes the decorator *throw*, and
  `characterSheet.ts` catches it and emits a stub row at cost 0. **A typo becomes a free power.**
- **NCM has a hardcoded `basecost` with no template in either edition**, so template guards miss it.

An authoring UI is a machine for generating exactly these inputs, so it needs a real validator:
xmlid resolves *in this character's edition*; required `option`/`input` supplied; adder
`exclusive`/`excludes` respected; `minval`/`maxval`/`mincost`/`maxcost` enforced; framework pool
not overspent. **This is a new concern with no existing home** — nothing in `core/` validates today,
because a `.hdc` from HERO Designer was already legal by construction.

### 4. A live points total

There isn't one. `characterPoints.ts` reads only the **declared** `basicConfiguration` a `.hdc`
carries — it never sums what the character actually costs. `allocate.ts` has the only summation, and
it iterates each category **top-level only**, which (see below) under-counts anything nested.

Authoring needs a real `spent()` over flattened traits + characteristic costs, split by bucket, with
complications counted against the edition's limit. Modest work, but it does not exist.

## A blocker found while probing: H2 was worse than the ledger said — ✅ now fixed

> **Resolved.** Phase 0 is done: the comparator is numeric, callers descend, and the hero golden
> master is re-based to normalize arrangement only. See `H2` in
> [`KNOWN_DEVIATIONS.md`](KNOWN_DEVIATIONS.md). The analysis below is kept as the record of what was
> found and why it mattered.


`KNOWN_DEVIATIONS.md` lists **H2** — `populateTrait`'s `.sort((a, b) => Number(a.position > b.position))` —
as affecting display order, and says *"point totals are order-independent"*. That undersells it.

The comparator never returns a negative, so nothing can move earlier in the array. Framework
containers arrive appended last (`normalizeCharacterItems` moves every non-`power` sub-key to the end
of the `power` array), so **the container is processed after its own slots**. When a slot looks up its
parent, the parent is not in `character[traitKey]` yet, and the slot is pushed to top level instead of
nesting.

Measured across the 37-fixture corpus:

| | shipped comparator | `a.position - b.position` |
|---|---|---|
| Fixtures with orphaned framework slots | **27** | **0** |
| greyman's Multipower | index 9, **0 children** | index 3, **4 children** |
| m-championsmush | 148 orphaned slots, 54 empty containers | 0 |

**Costs are unaffected**, which is why this has hidden for so long: `getParent`
(`characterTrait.ts:201`) resolves a parent by scanning `character[listKey]` for `id === parentid`,
and the orphaned container is still sitting at top level. So the Skill Enhancer discount (H12) and
framework slot pricing both still work.

The **visible** effect is on the sheet. `buildCharacterSheet` indents rows by descending
`item.powers` (`depth`), so today every Multipower, Elemental Control and VPP renders as an empty
container row with its slots flattened out beside it rather than nested under it.

**Why this blocks authoring:** frameworks are a core authoring feature, and an authoring UI would
build them nested-first. It would hit this immediately and look broken.

**Cost of fixing it:** with the numeric comparator, 60 tests across 8 suites fail. Most are golden
masters — expected, and exactly what the ledger's three-step process is for (re-base as an
intentional divergence). But **one failure is substantive**: `generateRandomCharacter spends exactly
its powers budget` drops 125 → 60 for Metamorph, because `allocate.ts` sums top-level only and the
now-nested slots vanish from its reduce. So the fix is:

1. numeric comparator,
2. **flatten the summations in `core/random`** (`allocate.ts`, `ruleOfXStats.ts`),
3. re-base the affected golden masters per the ledger.

That is a well-scoped change, but it is a prerequisite, not a side quest — and it is worth doing on
its own merits regardless of whether authoring ships.

## Suggested phasing

Each phase is independently shippable and leaves the app coherent.

| Phase | Scope | Notes |
|---|---|---|
| **0** | ✅ **done** — fix H2, teach callers to descend, re-base | Prerequisite for frameworks; stood alone |
| **A** | ✅ **done** — `core/authoring` emitter, migration 008, `origin: 'authored'`, live points total, characteristics + complications | Delivers a saveable, priced, editable character |
| **B** | ✅ **done** — skills / perks / talents from the catalogue, one generic renderer | The generic renderer earns its keep here |
| **C** | ✅ **done** — powers, advantages/limitations, and the first field group | The big one — and the per-power long tail is now a named, countable list |
| **D** | ✅ **done** — Multipower, Elemental Control, VPP | Needed Phase 0, and proved it |
| **E** | ✅ **done** — martial arts, equipment | 56 maneuvers per edition, largely table-driven |

Rough shape: **~2.5–4k lines**, against an 18.4k-line codebase — so a substantial feature, comparable
to `core/random/` plus its UI, but with a much larger share of it generic and data-driven.

## What Phase A actually built

`core/authoring/` — pure core, five modules:

| Module | Does |
|---|---|
| `types` | the **draft**: what the player chose, by xmlid, with no engine boilerplate |
| `catalogue` | reads the `.hdt` form metadata — the only place that touches templates |
| `emit` | draft → `ParsedCharacter`, satisfying the four parser habits below |
| `spend` | what it costs, asked of the engine; the 5E/6E complication fork |
| `source` | the stored-draft round trip, failing safe like `parseRecipe` |

Plus migration 008 (`source` column), `origin: 'authored'`, `AuthoringProvider`, and
`AuthorCharacterScreen`. 44 new tests.

**The four habits the emitter had to learn**, each found by running the engine rather than reading
it, and each failing quietly:

1. all seven trait categories present — `populateTrait` guards `null` but not `undefined`
2. `name: null`, not absent — absent renders the literal string `"undefined (…)"`
3. `alias`/`optionAlias` copied from the template's `display` — the engine prints them, never derives them
4. ids derived from position, so the same draft always emits the same document

**Characteristics are stated as totals** and converted by probing the engine at zero, so 5E's
figured characteristics (ED from CON, STUN from BODY+STR+CON) stay golden-mastered rather than
reimplemented. Same trick `core/random/characteristics` uses.

**One genuine special case surfaced: Rivalry.** Its description is a free-text adder whose
`optionAlias` carries the player's words behind an opening bracket — which is why
`Complication.label()` does `.slice(1)`. It is the only such adder in either edition (verified by
scanning both templates), so it is detected from the data rather than hardcoded, but it is **not a
general mechanism** and should not become one. Expect a handful more of these per phase; that is
the per-family long tail, and it is the honest cost of the feature.

## What Phase B actually built

**One renderer for four categories.** Skills, perks, talents and complications differ in which
fields their template entries declare, not in kind, so `TraitSection`/`TraitRow` draw whatever the
catalogue reports and nothing in the screen names a specific trait. Adding Phase B's three
categories added no per-trait UI code at all.

`AuthoredTrait` is one shape for all four, gaining `characteristic`, `option` and `familiarity`
alongside Phase A's `input`/`levels`/`adders`. `CatalogueTrait` likewise.

**Coverage, stated rather than silent.** `authorable()` is what the UI offers; `withheld()` is what
it does not, and the "Add" field shows the count. In 6E that is 59 of 68 skills, 9 of 13 perks and
22 of 24 talents. The withheld ones are traits whose decorators read fields no template declares —
Weapon Familiarity's category/member split, Transport Familiarity's nested adder tree, Autofire
Skills' per-skill list. Shrinking `BESPOKE` is a later phase, one decorator at a time.

**Two things the engine needed that the template alone doesn't give you:**

- **`basecost` must be copied onto the trait.** `CharacterTrait.cost()` reads the *trait's*
  basecost and never the template's — the template is consulted for per-level prices only. A
  3-point Talent emitted without it prices at 0 and still renders. Found by building one.
- **`levels` must always be emitted as a number.** `Roll` computes `base + trait.levels` unguarded,
  so an absent `levels` prints `NaN-` rather than failing.

**A skill has three ways to be priced, and picking the wrong one costs nothing rather than
failing**: by characteristic (`characteristicChoice`), by familiarity (a flat 8- for a point), or
by a chosen option (a Language's fluency, a Skill Level's breadth). The validator treats a missing
characteristic as an error for exactly that reason, and the test that says so is paired with a
build showing the same skill priced at 0.

**`normalizedTemplate` is new on `core/hero`.** An entry's xmlid is often *derived* from the sub-key
it sits under (`knowledgeSkill` → `KNOWLEDGE_SKILL`), and deriving it a second time in the
catalogue is how you end up offering a trait the engine cannot match. It also documents a legacy
quirk worth knowing: normalization concatenates the entries it collected onto the array they partly
came from, so every plainly-declared skill appears **twice**. Harmless to the engine, which only
ever looks one up by xmlid; a catalogue has to de-duplicate.

## What Phase C actually built

**Modifiers are the headline, and they needed no new pricing code.** `ModifierCalculator` already
defines `activeCost = cost x (1 + sum advantages)` and `realCost = activeCost / (1 - sum
limitations)`; Phase C just had to emit modifiers the engine recognises. A Blast with Area Of
Effect and an Obvious Accessible Focus comes out `base 50 / active 75 / real 37`, and all three are
pinned, because they answer different questions.

**Nothing records whether a modifier is an advantage or a limitation** — the sign of its computed
cost decides, and `ModifierCalculator` splits on exactly that. An option can flip a modifier from
one to the other, so a stored flag could disagree with the rules. The UI shows one list for the
same reason.

**Modifiers have their own adders, one level deep.** Area Of Effect is the everyday case: a Radius
*and* a Selective/Explosion/Mobile adder that changes what it costs. Without nested adders in the
catalogue an AOE silently prices as its bare option.

### The per-power long tail, made countable

The analysis warned that ~37 power decorators read fields no template declares. That turned out to
be **five** decorators in practice (`barrier`, `duplication`, `enduranceReserve`, `flash`,
`senseAffectingPower`) plus Resistant Protection, whose fields are read by the *character-level*
defence queries rather than by a power decorator at all.

Resistant Protection got a declared **field group** rather than being withheld, because it is the
most-taken defensive power in the corpus and the failure is invisible: emitted without
`pdlevels`/`edlevels`/`mdlevels`/`powdlevels` it costs full price and grants **no defence**. The
`.hdc` also carries a `levels` total, and across all 37 corpus characters that total is always the
sum of the four — so the emitter derives it rather than asking twice.

Everything else stays in `BESPOKE`, which is now a named list with a reason attached rather than a
vague warning. **6E offers 74 of 101 powers, 5E 79 of 102.** The withheld ones are the five
decorator cases, the framework/container powers (Phase D), and the sense-enhancements that state no
cost because they belong to a sense rather than to a sheet.

### A bug worth remembering

`asArray(entry.adder).map(adderOf)` — `Array.prototype.map` passes the **index** as the second
argument, which landed in `adderOf`'s `depth` parameter and read as "you are already nested" for
every adder but the first. Nested adders silently vanished. The signature is now `depth: 0 | 1` and
the comment says why; a default parameter that means something is a trap next to `.map`.

## What Phase D actually built

**This is the phase Phase 0 was for.** Before H2 was fixed a framework container was processed
*after* its own slots and never adopted them — the slots landed at the top level and the container
came out empty. An authoring UI would have produced exactly that, immediately, and looked broken.
`frameworks.test.ts` asserts the nesting explicitly, so it is a regression test for H2 as much as a
test of frameworks.

**A framework's identity is the sub-key it is emitted under, not its xmlid.** All three containers
are `GENERIC_OBJECT`; `normalizeCharacterItems` copies the sub-key onto the container as
`originalType`, and `isPowerFrameworkItem` matches on that to decide how a slot is priced. So
`FrameworkKind`'s three strings — `multipower`, `elementalControl`, `vpp` — are load-bearing
spelling, and getting one wrong yields a container that parses fine and slots that cost full price.

The three kinds price slots differently, which is the whole reason they exist:

| Kind | Container | Slot |
|---|---|---|
| Multipower | reserve as `basecost` | active ÷ 10 fixed, ÷ 5 variable |
| Elemental Control | reserve as `basecost` | active − reserve |
| Variable Power Pool | pool as **`levels`** | — |

The VPP is the odd one: it states its size in `levels` where the other two use `basecost`, and
`VariablePowerPool.cost()` reads it accordingly. A 50-point pool costs 75 — the pool plus a control
cost of half of it.

### A second latent engine bug, found the same way as H2 — and since fixed

`MultipowerItem` read `ultraSlot` off the **`CharacterTrait` wrapper** rather than off the trait,
behind a cast that stopped the compiler objecting. The wrapper has no such field, so the read was
always `undefined` and **every Multipower slot divided by 10** whatever kind it was. Confirmed at
the time by pricing the same authored slot both ways: 6 either way.

Recorded as **H13** and left for the correctness pass, which gated authoring to **fixed slots
only** through 2.8.0 — offering a choice that changed no number would have been worse than not
offering it.

**It is fixed now, and how it got settled is the part worth keeping.** The ledger entry said the
ratio needed a rulebook nobody had. Two things answered it instead:

- **Legacy's own dead code.** Its `attributes()` labels `ULTRA_SLOT="Yes"` as "Variable" (and
  "Flexible" in 5E). An ultra slot is the *fixed* kind — 6E renamed ultra → fixed, multi → variable
  — so legacy had the terminology backwards, which means **the ratios were right and hung on the
  wrong branch**. The bug was never in the arithmetic.
- **The corpus, which can test a divisor without containing a variable slot.** All 75 fixture slots
  are fixed, so pricing them checks the *fixed* divisor against budgets HERO Designer balanced:
  ÷10 lands junkyard exactly on its declared points and greyman, starborne, spyder and twilight
  within a handful, in both editions. ÷5 puts every one of them 11–39 over.

So: **fixed ÷ 10, variable ÷ 5**, and a slot with no flag at all reads as fixed, because HERO
Designer writes the attribute on every slot it emits.

Authoring now offers both — on a Multipower only, since an Elemental Control slot pays what it
exceeds the pool by and a VPP's slots are prefabs. Three places had to learn about it, and the
middle one is the trap: `AuthoredSlot` carries the flag, `emit` writes it as `ULTRA_SLOT`, and
**`toSource` had to be taught to store it**. That projection is a whitelist rather than a spread,
so a field nobody adds to it is dropped on save — a variable slot would have come back fixed, and
the character quietly cheaper than the player left it, with nothing on screen to say why.

## What Phase E actually built

**Maneuvers are the only catalogue entry with no xmlid at all.** The template states a `display`
and nothing else to identify it; `normalizeTemplateItem` derives `BASIC_STRIKE` from
`"Basic Strike"`. The emitter therefore writes `xmlid: 'MANEUVER'` plus a `display`, exactly as
HERO Designer does, and lets the engine derive the real one — so that rule lives in one place, and
it is the same place the template lookup uses.

**A maneuver's combat line is copied onto the trait**, because `Maneuver` reads every part of it
(`ocv`, `dcv`, `dc`, `phase`, `effect`, `addstr`, `category`, `weaponeffect`) off the *trait* rather
than the template — a real `.hdc` writes it out per maneuver. Emitted without it, a maneuver prices
correctly and renders with no OCV, no DCV and no effect. Same shape as Phase B's `basecost`, and
the third time this pattern has come up: **the template is consulted for prices, the trait for
everything else.**

55 of 56 maneuvers are offered in both editions; `WEAPON_ELEMENT` is withheld because it wants a
list of the weapons a style covers, which no template describes.

**Equipment is powers in a different bucket** — same catalogue, same modifiers, same field groups,
because `populateTrait` is called with `('equipment', 'powers', 'power')` and resolves items against
the powers templates. It needed no new machinery, only a second draft list.

### A limitation worth knowing about, found by testing it

**Equipment never contributes to a character's totals.** `powersForTotals` reads `character.powers`,
and nothing in the engine reads `character.equipment` at all. So a Resistant Protection bought as
equipment costs its points, shows its defences on the row, and adds **nothing** to PD/ED — where
the identical power bought innately adds 4.

That is faithful to legacy and the golden masters agree, so it is pinned rather than worked around:
changing it is a correctness-pass decision with a rules question attached (is carried gear "on" by
default?), not something an authoring layer should quietly paper over. What authoring does instead
is **warn**, so a player sees it rather than discovering it in play.

## The campaign allowance

A character declares what it was built on, and the player picks it.

`POINT_ALLOWANCES` is derived from `core/random`'s `POWER_LEVELS` rather than restating those
numbers — they are already checked against both rulebooks, and a second copy is how the legacy
`skillsets.json` came to disagree with itself about what a profession cost. The presets sit over
two plain numbers, so a GM running a campaign the rulebooks have no name for can still say what it
allows; the picker reads "Custom" whenever the numbers match no level, derived rather than stored,
so it cannot claim a level the numbers do not match.

**The editions are quoted in different units, and the field labels say so.** 5E quotes a base that
disadvantages then add to; 6E quotes the whole allowance and complications grant nothing. So a 6E
allowance's `base` is its level's *total*, and a 5E one's is its *base* — the same conversion
`declaredConfiguration` makes. Getting it backwards is the easiest mistake available here.

The budget lives on the **draft**, not on the screen: a character re-opened at a different
allowance than it was built to would silently be over or under budget for reasons nobody could see.

**Spending past the allowance is not an overspend — it is experience.** A character who costs more
than their starting points has earned the difference, which is what experience is in HERO, so the
meter reads "90 experience" rather than "90 over budget" and the excess is declared as
`experience` on the character. The sheet's nameplate already prints that beside the base
(`formatPoints` renders `"400 + 90 pts"`), so nothing needed adding there. The campaign **tier**
stays keyed on base alone: `powerTier` deliberately does not let a character climb the ladder by
earning points, and a 400-point character with 250 earned is still Standard Superheroic.

It also closed a gap. `AuthoringProvider` never wrote `basicConfiguration`, so an authored
character showed neither points nor campaign tier on the sheet's nameplate where a generated or
imported one does — `pointSummary` reads the declared block and returns null when it is absent.
The chosen allowance is now what gets declared.

## Risks worth naming up front

1. **The validator is the quality bar, not the forms.** Borne out in Phase A: the forms were a
   an afternoon, and every interesting bug was a legality question. Each error case in
   `validate.test.ts` is paired with a demonstration of the silent failure it prevents — keep that
   discipline, because a validator with no such pairing is untested by construction.
2. **Edition confusion.** `RANDOM_CHARACTER.md` records this biting twice, and it is worse here:
   authoring exposes *all* 477/409 entries, and the two editions share many xmlids with different
   costs. Never let a lookup default its edition.
3. **The golden masters do not cover authoring.** They prove parity on 37 imported files. A
   hand-built character is new input shape, and the corpus says nothing about it — the generator
   found H9 and H10 precisely because building characters exercises paths importing never did.
   Expect authoring to find more, and treat that as the feature working.
4. **`characterSheet.ts:333`'s try/catch will mask emitter bugs.** A malformed authored trait
   degrades to a cost-0 stub row rather than an error. Build the sheet and read the values when
   verifying; don't just check that nothing threw.
