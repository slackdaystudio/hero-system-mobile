# Known deviations — legacy quirks preserved for parity

> The `core/*` port reproduces the legacy engine **byte-for-byte**; the golden
> masters assert `core == legacy`, which proves **parity, not correctness**. To
> get there we deliberately preserved several legacy bugs/quirks. This ledger is
> the single source of truth for them.
>
> **Decision (agreed):** catalog now, keep faithful parity through the decorator
> port (sub-phase 3), then fix these in a dedicated **correctness pass**. Do not
> fix them inline while porting.

## Why fixing is a deliberate act, not a code tweak

- Fixing a quirk makes `core` diverge from legacy on purpose, so whichever golden
  master observes that output goes red. Each fix must **re-base** that assertion
  from "== legacy" to "== legacy **except** this documented deviation."
- **The corpus can't verify a fix it doesn't trigger.** Where a quirk is not
  exercised by the 37 fixtures, the fix needs a **purpose-built input** with an
  independently-derived expected value (legacy is not a valid oracle for the
  corrected behaviour).
- Where a quirk **is** triggered by the corpus, legacy is *wrong there too*, so
  the corrected value must be derived from the rules — not copied from legacy.

## Process for each fix (correctness pass)

1. One isolated commit per quirk.
2. Code fix + a **correctness test** pinning the new value (hand-built input where
   the corpus doesn't cover it).
3. Re-base the affected golden master to an explicit intentional-divergence (a
   comment linking back to this ledger entry).

## Summary

| ID | Quirk | Category | Corpus-triggered | Golden master affected |
|----|-------|----------|------------------|------------------------|
| T1 | Case-sensitive characteristic removal (no-op) | real bug | template output only | templates |
| T2 | Overlay `remove` copied onto finalized characteristics | cosmetic | yes (AI/Normal/…) | templates |
| T3 | `mainapp` overlays ignored | needs rules check | no model impact | none |
| T4 | Item-add into a missing base sub-key → `[undefined, item]` | real bug (edge) | unknown / no | templates |
| H1 | `character.template` always `undefined` | cosmetic | yes | hero |
| H2 | Trait sort uses a boolean-returning comparator, so frameworks lose their slots | ✅ **fixed** — was real bug, active | **yes — 27 fixtures** | hero (re-based) |
| H3 | Char/defense totals skip **duplicate** powers | ✅ **fixed** — was real bug, active | yes — junkyard, mark-li-v5a-433 | hero query (re-based) |
| H4 | `Maneuver.roll()` crashes on an unresolved-template maneuver | ✅ **fixed** — was real bug, active | yes — tazimmaad ("Cut") | traits (decorator, re-based) |
| H5 | VPP contents counted toward totals | ✅ **fixed** — was real bug, active | yes — adamantine (Leaping), m-championsmush | hero query / movement |
| H6 | Unusual-defense duplicates read off the collapsed array | ✅ **fixed** — was real bug, active | yes — defensor, m-championsmush | hero query (re-based) |
| H7 | Resistant Protection's `mdlevels` fed *every* unusual-defense total | ✅ **fixed** — was real bug, active | yes — defensor, adamantine | hero query (re-based) |
| H8 | Unusual defenses ignored `affectsPrimary`/`affectsTotal` | ✅ **fixed** — was real bug, active | **yes — 14 fixtures (base form)** | hero query (re-based) |
| H9 | Enhanced Perception ignores `allcost` | ✅ **fixed** — was real bug, active | yes — adamantine (9→27), jane-fawn (2→6) | traits (decorator, re-based) |
| H10 | `Clinging.cost()` adds a stray `+1` | ✅ **fixed** — was real bug, active | yes — mark-li, aoe, spyder2022 | traits (decorator, re-based) |
| H11 | `HandToHandAttack.roll()` computes a half-die then drops it | ✅ **fixed** — was real bug (latent) | no — the corpus never reaches the branch | none (no re-base needed) |
| H12 | Skill Enhancer's min-1 floor charged a *free* skill 1 point | ✅ **fixed** — was real bug, active | yes — greyman, m-championsmush, twilight | traits (decorator, re-based) |
| H13 | Multipower slot divisor reads `ultraSlot` off the wrapper, so it never varies | ✅ **fixed** — was real bug (latent) | no — every corpus slot is fixed | none (no re-base needed) |
| U1 | `capitalize` only upper-cases the first char | cosmetic (app-only) | no | (unit test) |
| U2 | `getMultiplications(0, …)` → `-Infinity` (log of zero) | ✅ **fixed** — was real bug, active | yes — mark-li-v5a-433 (Gecko pads) | traits (decorator, re-based) |
| U3 | `getMultiplications` off-by-one on exact powers of a non-2 step | ✅ **fixed** — was real bug (latent) | no — none; golden masters unchanged | none (no re-base needed) |

---

## T1 — Case-sensitive characteristic removal is a no-op

- **Where:** `core/templates/heroDesignerTemplate.ts` `finalizeCharacteristics`
  (legacy `HeroDesignerTemplate._finalizeCharacteristics`).
- **Legacy:** the overlay `remove` list is upper-cased (`"STR"`) but the
  characteristic keys are lower-case (`"str"`), so `delete characteristics["STR"]`
  removes nothing. AI/Automaton/Computer/Normal templates never actually drop the
  physical characteristics they intend to.
- **Correct:** normalize case so the removals apply.
- **Corpus impact:** the AI fixture (and other automaton-family chars) already
  *lack* the physical characteristics in their own data (AI has only
  `dex/int/ego/ocv/dcv/omcv/dmcv/spd`), so `getCharacter` output is **unaffected**
  and there is no crash. Only the **finalized template** changes → the *templates*
  golden master diverges for AI/AI6E/Normal.
- **Fix + verify:** lower-case the removal keys; templates unit test asserting the
  AI/Normal finalized characteristics no longer contain `str/con/body/…`; re-run
  the hero golden master to confirm characters are unaffected.

## T2 — Overlay `remove` array copied onto finalized characteristics

- **Where:** `finalizeCharacteristics` — after applying `remove`, every overlay
  entry (including `remove` itself) is copied onto `finalTemplate.characteristics`,
  leaving a stray `remove` key.
- **Legacy:** same.
- **Correct:** don't copy the `remove` directive as a characteristic.
- **Corpus impact:** the stray key rides on AI/Normal finalized templates; harmless
  (nothing iterates it as a real characteristic). Visible to the *templates* golden
  master.
- **Fix + verify:** skip `remove` in the copy loop; templates unit test asserting no
  `remove` key on finalized characteristics. Likely folded in with T1.

## T3 — `mainapp` overlays are ignored

- **Where:** `finalizeTemplate` merges characteristics + 8 item categories but never
  `mainapp`; the overlay's `mainapp` (e.g. Heroic/Normal `ncm` config) is dropped.
- **Legacy:** same.
- **Correct:** unclear — may be intentional. `getCharacter` never reads
  `template.mainapp`, so there is **no impact on the ported model**.
- **Fix + verify:** none for the model. Flag for a rules/product check on whether
  `mainapp` overlays matter elsewhere (character creation). Lowest priority.

## T4 — Item-add into a missing base sub-key yields `[undefined, item]`

- **Where:** `finalizeItems` — when an overlay adds items to a category whose base
  sub-key is `undefined`, the result is `[undefined, item]` (legacy:
  `list = [finalTemplate[key][subKey]]` = `[undefined]`).
- **Legacy:** same.
- **Correct:** initialize to `[]` (or the item) instead of `[undefined, …]`.
- **Corpus impact:** not triggered by the built-in overlays (all add nothing to
  empty categories); custom-template coverage unclear. Low risk.
- **Fix + verify:** guard the undefined base; hand-built overlay test.

## H1 — `character.template` is always `undefined`

- **Where:** `getCharacter` sets `template: template.baseTemplateName`, a field that
  does not exist on the finalized template.
- **Legacy:** same → `undefined`.
- **Correct:** decide the intended value (probably the base template id/name) and
  set it. The field appears unused downstream.
- **Corpus impact:** `hero` golden master observes `template === undefined`.
- **Fix + verify:** choose the correct value; hero unit test; re-base hero golden
  master.

## H2 — Trait sort uses a boolean-returning comparator — ✅ FIXED

**Fixed.** The comparator is now `.sort((a, b) => a.position - b.position)`.

- **Where:** `populateTrait` — `.sort((a, b) => Number(a.position > b.position))`
  (legacy returns the raw boolean; V8 coerces to 0/1). Never returns a negative, so
  it is not a correct comparator: nothing can move earlier in the array, which makes
  the sort a no-op on anything already out of order.
- **Legacy:** same.

**This entry previously read "affects display order; point totals are
order-independent". That was wrong about the scope, and right about the totals.**
The ordering and the *structure* are the same problem:

`normalizeCharacterItems` moves every non-`power` sub-key — `<MULTIPOWER>`,
`<ELEMENTALCONTROL>`, `<VPP>`, `<LINGUIST>` — onto the **end** of its category's
list, whatever its `POSITION` says. `populateTrait` then attaches each slot by
looking its `parentid` up in `character[traitKey]`. With the container still
unprocessed the lookup misses, and the slot is pushed to the **top level** instead
of nesting. So every framework came out as an empty container with its slots
scattered beside it.

- **Corpus impact:** **27 of 37 fixtures** had at least one orphaned slot —
  `m-championsmush` alone had 148 across powers and skills, and 54 empty containers.
  `greyman`'s Multipower held 0 of its 4 slots. After the fix: zero orphans, corpus-wide.
- **Costs did not move, anywhere.** `getParent` (`characterTrait.ts`) resolves a
  parent by scanning `character[listKey]` for the id, and the container sits there
  either way — which is why the Skill Enhancer discount (H12) and framework slot
  pricing went on working for years while the nesting was broken. The decorator and
  query golden masters were **not** re-based for H2, because nothing in them changed.
- **What users see:** the sheet indents by descending the child array, so every
  Multipower, Elemental Control and VPP previously rendered as an empty container
  row with its slots flattened out beside it. They now nest.
- **Fix + verify:** numeric comparator; `hero/__tests__/traitSort.test.ts` pins
  ascending order, framework/enhancer nesting, zero orphans corpus-wide, and that the
  affected costs are unchanged; hero golden master re-based to normalize **arrangement
  only** (see `canonical` there) so all 37 fixtures still compare in full.

**Callers had to learn to descend.** Anything summing or scanning a trait list
top-level-only would now under-read. `withDescendants` (`core/util`) and
`TRAIT_CHILD_KEYS` (`core/hero`) were added for this, and the child key is **not
`powers` for most categories** — a Skill Enhancer nests under `skills`, a martial
style under `maneuver`, equipment under both `power` and `powers`. Updated:
`allocate.skillsBudget`, `ruleOfXStats`, and `characterSheet` (rows, alternate-ID
filter, alternate-ID scan).

## H3 — Characteristic/defense totals skip duplicate powers — ✅ FIXED

**Fixed.** The five array branches now delegate each element to their own scalar branch,
which applies the `affectsPrimary`/`affectsTotal` guard per power — the shape
`getTotalCompoundPowerIncrease` already used. Three of them additionally `+=`'d a recursion
that already returned the running total (a latent double-count), and
`getTotalCharacteristicPoints` passed `showSecondary` as its `value` argument; both are gone.

- **Corrected values** (derived from the characters' data, not from legacy) are pinned in
  `core/hero/__tests__/duplicatePowers.test.ts`; `queryGoldenMaster.test.ts` skips exactly
  these cases via `H3_DIVERGENCE`, and still compares everything else — including the whole
  `showSecondary: false` column — against legacy.
- **Actual corpus impact: 2 fixtures, not the 17 estimated below.** 17 fixtures *carry*
  duplicate xmlids, but only `junkyard` (Force Field ×2 → 12/0 becomes 20/8; the second,
  "Force Bubble", stays excluded by `affectsTotal: false`) and `mark-li-v5a-433` (Armor ×2,
  "Hide" + "Scales" → PD 8/0 becomes 18/10, ED 6/0 becomes 16/10) actually change. All 16
  divergences are `showSecondary: true` only, since every contributing duplicate is
  `affectsPrimary: false`.
- **The original plan below was wrong in one respect.** "Each duplicate power contributes"
  assumed all duplicates are cumulative. `m-championsmush` has 8 Force Fields *in a
  Variable Power Pool* — alternative configurations — and summing them read 118/116. That
  is not a duplicate-counting question at all; it is **H5**, fixed separately. With H5 in
  place, m-championsmush no longer diverges here.
- **Scope was under-counted too:** the same quirk has two more sites in the unusual-defense
  path that these five branches don't cover. Logged as **H6**.

### Original entry (for reference)

## H3 (original) — Characteristic/defense totals skip duplicate powers (**active bug**)

- **Where:** the array branches of `getTotalCharacteristicPoints`,
  `getTotalDensityIncreaseCharacteristics`, `getTotalArmorDefenseIncrease`,
  `getTotalResistantDefensesIncrease`, and `getResistantDefense`. When a
  characteristic/defense xmlid appears **more than once**, `toMap` collapses them
  into an array; the array branch then tests the **array's own** (undefined)
  `affectsPrimary`/`affectsTotal` and recurses with the wrong args, so **none of the
  duplicated powers contribute**.
- **Legacy:** same.
- **Correct:** iterate the array and test each **element's** props; recurse with the
  correct argument list — each duplicate power contributes.
- **Corpus impact:** **triggered by 17 fixtures** (e.g. `junkyard` `FORCEFIELDx2`,
  `defensor` `POWERDEFENSEx2`, `mark-li` `ARMORx2`). Today two Force Fields yield
  **zero** resistant defense. The query golden master is blind to it (legacy is
  equally wrong).
- **Fix + verify:** correct the five array branches. Corrected values must be derived
  from the rules (sum the duplicates), **not** from legacy. Re-base the query golden
  master for the affected characters, and add a hand-built test (a character with two
  Force Fields) pinning the summed total. Highest-value fix here.

## H5 — Variable Power Pool contents counted toward totals — ✅ FIXED

- **Where:** every `powersMap` construction in `core/hero/heroDesignerCharacter.ts` — six
  sites that each built `toMap(flatten(character.powers, 'powers'))` and so swept a VPP's
  contents in alongside everything else.
- **Legacy:** same.
- **Correct (rules, confirmed with Phil):** a VPP holds prefabricated powers the player
  swaps between for different occasions; **none of them is active until the player allocates
  pool points to it.** So no pooled power may contribute to characteristics, defenses or
  movement. This is specific to VPPs — multipower / elemental-control slots are a separate
  question and are deliberately untouched.
- **Fix:** the six sites now call `powersForTotals(character)`, which filters powers whose
  parent's `originalType === 'vpp'` before indexing. It mirrors
  `isPowerFrameworkItem(…, 'vpp')` but resolves parents against one shared id map rather
  than rebuilding it per power (that helper is O(n) per call).
- **Corpus impact:** 3 fixtures hold pooled powers — `adamantinerebuild210109` (19 slots),
  `m-championsmush` (41), `mikayla-priestess` (10). Two visible effects:
  **(a)** `adamantine`'s Leaping was **40**, of which 20 came from the pooled "Leap Tall
  Buildings…"; it is now **20**. No golden master covers this — `movement.test.ts` pins
  hand-derived values because legacy's `getMovementTotal` lived in a React component and has
  no lib to compare against — so it was previously unpinned. Now pinned.
  **(b)** `m-championsmush`'s 8 pooled Force Fields (Undercover 10/10, Heavy 20/20,
  Hardened 17/17, Impenetrable 17/17, Anti-Physical 32/10, Subtle 10/10, Anti-Energy 10/26,
  Core Shielding 0/0). Legacy read 2/0 by accident — its duplicate-skipping bug (H3) masked
  them. Fixing H3 alone would have read **118/116**, i.e. all eight configurations worn at
  once. It now reads 2/0 for the right reason, so this entry is a **prerequisite of H3**,
  not an independent cleanup.
- **Verify:** `core/hero/__tests__/duplicatePowers.test.ts` (H5 block) pins the pooled Force
  Fields out of m-championsmush's defenses, adamantine's Leaping at 20, and — as the control
  — mark-li's *unpooled* Armors still counting, so the guard keys on pool membership rather
  than on the power.

## H6 — Unusual-defense duplicates read off the collapsed array — ✅ FIXED

**Fixed.** `getUnusualDefensePoints` took a single `Obj` and had no array branch at all, so a
repeated xmlid — which `toMap` collapses into an array — read `.levels` off the array itself
(`undefined`) and **every one of the duplicates contributed 0**. It now sums the collapsed
powers, tracking resistant points separately.

- **The 5E EGO bonus is added once per character, not once per power.** The old code added
  `EGO/5` inside the single-power path; naively looping it would have multiplied the bonus by
  the number of duplicated Mental Defence powers. No 5E fixture currently has duplicated
  Mental Defence, so the corpus could not have caught this — it is guarded by construction.
- **Corpus impact:** `defensor` buys Power Defense **twice** (two standalone powers, 10 and 5)
  and received **none** of it → now 25 (see H7 for the rest of that arithmetic).
  `m-championsmush` holds four Mental Defences (12 + 10 + 10 + 10) and received **none** → now
  42. Both containers there (`Defense Baseline`, `Psychic Shroud`) are `originalType: 'list'`
  — organisational folders, **not** frameworks — so they genuinely stack. This is the H3/H5
  distinction again: a `list` is not a VPP, and its contents are all active.
- **The original entry's premise was wrong**, kept below for the record. It assumed defensor's
  two Power Defences "should total 15" and flagged the reported 10 as un-traced. The 10 was
  two separate faults landing on a plausible number: the duplicates contributing 0, plus 5 of
  *mental* defence leaking in via **H7**, plus 5 from the compound power. Phil confirmed the
  rule: Resistant Protection feeds each unusual defense through its matching field, so the
  answer is `10 + 5` (the two powers) `+ 5` (Resistant Protection `powdlevels`) `+ 5` (the
  compound's Resistant Protection `powdlevels`) = **25**.
- **Pinned by:** `core/hero/__tests__/unusualDefenses.test.ts`; golden master skips these
  queries via `UNUSUAL_DEFENSE_DIVERGENCE`.

## H11 — Hand-to-Hand Attack computes a half-die, then drops it — ✅ FIXED

- **Where:** `core/traits/powers/handToHandAttack.ts:31-42`. It derived `partialDie` from
  `levels + STR / 5`, used it in both adder branches, and then ignored it in the `else`:

  ```ts
  if (parseFloat((dice % 1).toFixed(1)) !== 0.0) {
      partialDie = parseFloat((dice % 1).toFixed(1)) >= 0.6;   // computed...
      dice = Math.trunc(dice);
  }

  if (adderMap.has('PLUSONEPIP')) {
      roll.roll = partialDie ? `${dice + 1}d6` : `${dice}d6+1`;
  } else if (adderMap.has('PLUSONEHALFDIE')) {
      roll.roll = partialDie ? `${dice + 1}d6` : `${dice}½d6`;
  } else {
      roll.roll = `${dice}d6`;                                  // ...and dropped
  }
  ```

- **Legacy:** same — `src/decorators/powers/HandToHandAttack.js:79-85` is byte-identical, so the
  port is faithful and this has been shipping. Not a port error.
- **Correct:** 5 STR is 1d6 and 3–4 STR beyond that is a half-die, so an HA whose `levels + STR/5`
  lands on `.6` or `.8` does **N½d6**. `Maneuver.getNormalDamage()` (`maneuver.ts:145-150`) faces
  the identical sum and keeps the half — the two disagree, in the same engine, about the same rule.
  `heroDesignerCharacter.getStrengthDamage()` is the third and also keeps it.
- **Fix:** `roll.roll = partialDie ? `${dice}½d6` : `${dice}d6`` — the same line
  `Maneuver.getNormalDamage()` already ended on, for the same sum. **Only the `else` branch was
  touched;** see below.
- **Impact:** understated damage by half a die. User-visible on the sheet and in the roller.
- **Corpus-triggered:** **no**, and more thoroughly than first thought. The 37 fixtures contain
  exactly **one** decodable Hand-To-Hand Attack — `aoe`'s, at STR 57 — and it both sits at a
  remainder of `.4` (under the threshold) *and* carries a `PLUSONEHALFDIE` adder, so it never
  reaches the broken branch at all. `bridget`'s is nested where `flatten` doesn't descend.
  Triggering it needs `levels + STR/5` to end `.6` or `.8` **and** no adder.
- **No golden master moved**, and none needed a divergence marker — the second fix after U3 to
  need no re-base. The corpus output is byte-identical before and after.
- **Oracle:** the HERO damage table (5 STR is 1d6, 3–4 STR beyond that is a half-die). Legacy is
  wrong so it cannot be the oracle, and since the bug is latent the *fixtures* cannot be either —
  nothing in them reaches the branch. Two implementations in this same engine already agreed
  against the code: `Maneuver.getNormalDamage()` (`maneuver.ts:145-150`) faces the identical sum
  and keeps the half, and `heroDesignerCharacter.getStrengthDamage()` does the same for a bare
  punch. After this fix all three agree, which
  `handToHandAttack.test.ts` asserts directly across STR 0–80.
- **The adder branches are deliberately untouched.** `partialDie ? `${dice + 1}d6`` reads as
  "N½d6 plus another half is (N+1)d6", matching the rules' `Nd6 → Nd6+1 → N½d6 → (N+1)d6`
  progression — but whether `+½d6` advances one step or two is a rules question with no
  independent source to hand, and no fixture exercises it. Pinned as-is by the test so a future
  change has to be deliberate. **If you have the rulebook, this is worth a look.**
- **Found** while porting STR damage to the sheet, which needed the same rule — not by the corpus,
  which cannot see it.
- **Pinned by:** `traits/__tests__/handToHandAttack.test.ts` (reverting the fix fails 7).

## H12 — Skill Enhancer's min-1 floor charged a free skill — ✅ FIXED

- **Where:** `core/traits/modifierCalculator.ts` `realCost()`. The Skill Enhancer discount was
  `realCost = realCost - 1 <= 0 ? 1 : realCost - 1`, applied to every child of an enhancer
  (`SCIENTIST`, `JACK_OF_ALL_TRADES`, `LINGUIST`, `SCHOLAR`, `TRAVELER`, `WELL_CONNECTED`). The
  `<= 0 ? 1` floor was meant to stop a *paid* skill's −1 reduction dropping below 1 — but it also
  fired on a skill whose cost was already **0**, pushing it up to 1.
- **Legacy:** same — `decorators/ModifierCalculator.js` is byte-identical, so this has been shipping.
- **Correct:** a Skill Enhancer reduces the cost of each *related, paid* Skill by 1, to a minimum of
  1. A free Skill — a native/everyman language (`Skill.cost()` returns 0 for `nativeTongue` /
  `everyman` / `familiarity` at the 0 tiers) — has nothing to reduce and stays **0**. HERO Designer
  prices a native tongue at 0 whether or not Linguist is present, so legacy is wrong here and is not
  the oracle. **Fix:** guard the clamp on `realCost > 0`.
- **Corpus impact:** **3 fixtures**, each a native tongue under Linguist reading 1, now 0 —
  `greyman` (Mandaarian), `m-championsmush` (Romany, displayed "Native"), `twilight` (English). Only
  `realCost()` moves; `cost()`/`activeCost()` are 0 in both engines. Paid skills under an enhancer are
  unaffected — the −1 and the min-1 floor for them are untouched.
- **Found:** chasing a "ghost" report that Skill Enhancers *don't* discount skills. They do (verified
  across the corpus and four of Phil's own `.hdc` files); the only real defect was this opposite-
  direction one — an enhancer *over*charging a free skill by a point.
- **Pinned by:** `core/traits/__tests__/skillEnhancer.test.ts` — the −1/min-1 boundary at 0/1/2/5
  points on hand-built inputs, the three corrected corpus natives at 0, and a control that a paid
  language under Linguist still gets its −1. The decorator golden master skips just these three
  `realCost()` comparisons via `H12_REALCOST_DIVERGENCE` and still compares their `cost()`/`activeCost()`
  and every other trait.

## H10 — Clinging adds a stray point — ✅ FIXED

- **Where:** `core/traits/powers/clinging.ts` ended `return cost + 1`, putting the power's floor
  at 11.
- **Legacy:** same — `Clinging.js` is byte-identical, so this has been shipping.
- **Correct:** 5E prices Clinging at **10 base, +1 per +3 STR**. Nothing in the rules adds a
  point. The template says so itself: `basecost: 10`, `lvlcost: 1`, `lvlval: 3`, and a
  **`mincost: 10`** that the stray +1 made unreachable — the engine's own data contradicted the
  engine.
- **Three sources agreed against the code**, which is what made this safe to fix without an
  oracle: that `mincost`, the rules text the template quotes (5E p94), and the legacy
  random-character prose, which prices `Clinging 20 STR` at 10. The same shape as H9.
- **Corpus impact:** every Clinging is one point cheaper — `mark-li-v5a-433`'s Gecko pads 11 →
  **10**, `spyder2022` 14 → **13**, and `aoe` 44 → **43** (its Clinging sits inside a compound
  power, so the change surfaces on the parent — `flatten` never descends into compound children,
  so the compound is the only trait the golden master compares for them).
- **Found via the random character generator**, not the corpus: Martial Artist's powerset priced
  `Clinging 20 STR` at 10 while the engine said 11. First noticed in passing during **U2**, whose
  entry called the +1 "a separate, unreviewed legacy oddity" and pinned Gecko pads at 11 —
  that pin now reads 10.
- **Pinned by:** `traits/__tests__/clinging.test.ts`; the decorator golden master skips these via
  `H10_COST_DIVERGENCE`.

## H9 — Enhanced Perception ignores what it enhances — ✅ FIXED

**Fixed**, and not where the entry below guessed. The cost never reached
`enhancedPerception.ts` at all: `powerDecorator` wraps it in **`SenseAffectingPower`**, which is
the outer decorator and overrides `cost()`. That class *did* read `groupcost` and `sensecost` —
it simply had no branch for `ALL`, so `isGroup('ALL')` was false and an all-senses power fell
through to the **sense** branch at 1 point a level.

`SenseAffectingPower` now tallies `all`/`group`/`sense` and prices each from its own template
field, for the power's own option and for its adders alike.

- **Corrected values** (from the rules, not legacy): `adamantine` 9 → **27** (9 levels ×
  `allcost` 3), `jane-fawn` 2 → **6**. Pinned in `traits/__tests__/enhancedPerception.test.ts`;
  the decorator golden master skips just these two via `H9_COST_DIVERGENCE` and still compares
  their `roll()`, which was never wrong.
- **Guarded, deliberately:** of the five powers routed through `SenseAffectingPower` (`CONCEALED`,
  `ENHANCEDPERCEPTION`, `MICROSCOPIC`, `RAPID`, `TELESCOPIC`) **only Enhanced Perception has an
  `allcost`**. So `ALL` counts as all-senses *only where the template prices it*; the others keep
  legacy's behaviour rather than being handed a price the rules data never stated for them. The
  `?? 0` on `allcost` is load-bearing for the same reason — `0 * undefined` is `NaN`.
- **Two sources agreed against the code**, which is what made the fix safe without an oracle: the
  template's own `allcost: 3`, and the legacy archetype prose, which independently prices
  `ES: PER +1` at 3.
- **Unblocked the random character generator** — `Patriot`'s powerset now costs its balance
  exactly, with `ES: PER +1` finally priced at 3.

### Original entry (for reference)

## H9 (original) — Enhanced Perception ignores what it enhances (**active bug**)

- **Where:** `core/traits/powers/enhancedPerception.ts` overrides only `roll()`. Its cost falls
  through to `TraitDecorator`, which prices `basecost + round((levels / lvlval) * lvlcost)` —
  but the `enhancedperception` template has **no `lvlcost`**. What it has is `allcost: 3`,
  `groupcost: 2`, `sensecost: 1`, and none of them is ever read. The observable: cost comes out
  as *1 per level*, whatever the power enhances.
- **Legacy:** same — `adamantine`'s reads 9 in both engines.
- **Correct:** 5E prices Enhanced Perception by *what* it enhances: **+1 to all Sense Groups = 3**,
  to a single Sense Group = 2, to a single Sense = 1 — which is exactly what those three template
  fields are. The power carries an `optionid` (`ALL`, a group, or a sense) selecting between them.
- **Corpus impact:** `adamantinerebuild210109` has Enhanced Perception at `levels: 9`,
  `optionid: ALL`. Priced **9**; the rules say **27**. Eighteen points light.
- **Also blocks the random character generator.** `Patriot`'s legacy powerset prices
  `ES: PER +1` at **3** — the `allcost` — while the engine says 1, so its powerset cannot be
  authored to hit its balance until this is fixed. See docs/RANDOM_CHARACTER.md.
- **Fix + verify:** select on `optionid` and price from `allcost`/`groupcost`/`sensecost` ×
  levels; correctness test pinning adamantine at 27; re-base the decorator golden master for it.
  Note the archetype prose is a useful second opinion here — it independently prices a +1 to all
  senses at 3, agreeing with the template against the code.

## H8 — The unusual defenses ignored `affectsPrimary`/`affectsTotal` — ✅ FIXED

- **Where:** `getTotalUnusualDefense` / `getUnusualDefensePoints` — neither the Mental / Power /
  Flash Defense powers nor the Resistant Protection contribution were gated on visibility, so
  a secondary-only power fed these totals **in the base form too**.
- **Legacy:** same. Spotted while fixing H7 and logged there rather than folded in; Phil's
  ruling — *"those powers in Defensor's list should follow standard rules for visibility"* —
  settled it.
- **Correct:** the same rule the rest of the engine inlines at ~40 sites, and which
  `getDefense` already applied to compound-power children two functions away:
  `(affectsPrimary && affectsTotal) || (!affectsPrimary && affectsTotal && showSecondary)`.
  This entry makes the top-level path agree with the compound path; it was an internal
  inconsistency, not a policy choice.
- **Corpus impact: 14 of 37 fixtures**, base form only — nearly every character who owns these
  defences at all had a wrong base form. The alternate-ID column is untouched.
  - `defensor`: Mental `10/5 → 0/0`, Power `20/10 → 0/0`. Every one of his unusual-defense
    powers is `affectsPrimary: false`, so his base form correctly has none.
  - `adamantinerebuild210109`: Mental `10/1 → 1/1`, Power `5/1 → 1/1`. Its Resistant Protection
    *is* primary-affecting, so 1 point survives — the rule discriminates rather than
    blanket-zeroing, which is the case worth keeping a test on.
- **What it looked like:** toggling Alternate Identity off dropped defensor's PD from 17 to 7
  (PD honoured visibility) while Mental stayed at 10 and Power at 20 — one sheet showing his
  base-form physical defences beside his alternate-form mental defences. The four now move
  together.
- **Fix:** the rule is now a named `countsTowardTotal(power, showSecondary)` helper rather than
  a 41st inlining. The other ~40 sites were left alone — a mechanical sweep of them is its own
  change, and not one to make while the golden master is already re-basing.
- **Pinned by:** `core/hero/__tests__/unusualDefenses.test.ts` (H8 block); golden master skips
  the base-form column for the 14 fixtures via `H8_BASE_FORM_DIVERGENCE`.

## H7 — Resistant Protection's `mdlevels` fed every unusual-defense total — ✅ FIXED

- **Where:** `getTotalUnusualDefense` — `defenses.nonResistant += powersMap.get('FORCEFIELD').mdlevels || 0`
  (and the same for `resistant`), run for **every** query regardless of `powerXmlId`. So a
  Power Defense query collected the character's *mental* defense, and a Flash Defense query
  collected a number from nothing at all.
- **Legacy:** same. Found while tracing H6 — the two faults were compounding, which is exactly
  why H6's reported figure (10) matched neither the buggy value (0) nor the naive fix (15).
- **Correct (rules, confirmed with Phil):** Resistant Protection splits its points across the
  defenses — `defensor`'s is `levels: 20` = 5 PD + 5 ED + 5 Mental + 5 Power — and feeds each
  unusual-defense total through **the field matching that defense**. There is no `flashlevels`
  field anywhere in the HERO Designer data, so it contributes **nothing** to Flash.
- **Fix:** `UNUSUAL_DEFENSE_FORCE_FIELD_LEVELS` maps `MENTALDEFENSE → mdlevels`,
  `POWERDEFENSE → powdlevels`; a query with no entry (Flash) gets nothing. The lookup also
  reads through `asArray`, since Force Field can itself be duplicated (H6's mechanism —
  `junkyard` and `m-championsmush` both carry two or more).
- **Corpus impact:** `defensor` Flash `5/5 → 0/0` and `adamantine` Flash `1/1 → 0/0` — both
  were pure leak, neither character has a Flash Defense power. Mental Defence is unchanged
  everywhere, because `mdlevels` was the one query the old line got right.
- **Not addressed (pre-existing, still open):** this Force Field block ignores
  `affectsPrimary`/`affectsTotal` entirely, so a secondary-form Resistant Protection feeds the
  unusual-defense totals even at `showSecondary: false`, unlike every other total. Visible on
  `defensor` (`20/10` in the base form). Left alone deliberately — it is a distinct quirk from
  the field confusion, and needs its own rules check.

### Original entry (for reference)

## H6 (original) — Unusual-defense duplicates read off the collapsed array (**active bug**)

- **Where:** two sites the H3 entry's "five array branches" didn't enumerate:
  1. `getTotalUnusualDefense` — `(powersMap.get('FORCEFIELD') as Obj).mdlevels || 0`, run
     twice. With Force Field duplicated, `powersMap.get` returns an **array**, `.mdlevels` is
     `undefined`, and `|| 0` silently contributes nothing.
  2. `getUnusualDefensePoints` — takes `unusualDefense: Obj` and has **no array branch at
     all**, so `unusualDefense.levels || 0` is `0` for any duplicated xmlid.
- **Legacy:** same. Same root cause as H3 (`toMap` collapses a repeated xmlid into an array,
  then the code reads properties off the array itself), so H3's fix does **not** reach these.
- **Correct:** sum across the duplicates, as H3 does for the other five branches.
- **Corpus impact:** `defensor` carries `POWERDEFENSE` ×2 (levels 10 and 5 — should total 15)
  and `FORCEFIELD` ×2; `junkyard` carries `FORCEFIELD` ×2. Both collapse to arrays, so both
  array reads yield 0. **Not fully traced:** `defensor` currently reports `PowD=10/10`, which
  is neither 0 nor 15, so a third contributor (the `COMPOUNDPOWER` path, which also feeds
  these totals) is involved. Trace it before fixing — the corrected value must come out of
  the rules, and the mechanism here is not yet fully understood.
- **Fix + verify:** give both sites an array branch; hand-built character with two Power
  Defenses pinning the summed total. Note `getUnusualDefensePoints` assigns
  (`defenses.nonResistant = points`) rather than accumulating, so the array branch needs care
  — a naive recursion will clobber rather than sum. Also worth a look while in there:
  `getTotalUnusualDefense` adds Force Field's **mental** defense (`mdlevels`) to *every*
  unusual-defense query, including `POWERDEFENSE` and `FLASHDEFENSE`, which looks wrong
  independently of the array bug.

## H4 — `Maneuver.roll()` crashes on an unresolved-template maneuver — ✅ FIXED

**Fixed.** The guard is now `hasOwn(trait, 'effect') && trait.template` — the *value*, not
just the property — so an unresolved maneuver falls through to the delegated roll.

- **The symptom was not a crash.** `characterSheet.ts:333` wraps each trait in a try/catch
  that degrades a throwing trait to a stub row, so the throw never reached the user. It
  reached them as **silent data loss**: `tazimmaad`'s maneuver — xmlid `JAB`, but displayed
  under its own name **"Cut"** — rendered with `realCost: 0` and **no combat line**, where it
  should read cost 3 at OCV +2 / DCV +1. Every other maneuver on the sheet was fine, which is
  what made it invisible. Correct the entry's old framing accordingly: `roll()` does throw in
  isolation, but nothing in the app calls it outside that try/catch.
- **Why the template is `undefined`, and why that is correct data:** maneuver templates are
  keyed by **display name**, and there are 53 standard ones — no "Jab" among them. A
  hand-named maneuver therefore resolves to `undefined`. That is not a lookup bug; there is
  genuinely nothing to resolve. `JAB` is the corpus' only such maneuver, and the only trait
  in the whole corpus whose legacy `roll()` throws.
- **Why the delegated roll is the right answer, not just a safe one:** `JAB` is
  `useweapon: true`, and the damage branch requires `!useweapon`. So a *resolved* template
  would have declined it and delegated too — the corrected value is what the working path
  already produces. All of tazimmaad's maneuvers are weapon-using and roll `null`; JAB now
  agrees with its siblings instead of being special.
- **Golden master:** `safeRoll` is **gone**. It existed solely to let "both engines threw
  identically" count as a match for this one trait; with JAB's roll skipped via
  `H4_ROLL_DIVERGENCE`, every other trait's roll is now compared directly — a strictly
  stronger assertion than before. Only `roll()` is skipped for JAB; its costs still match
  legacy exactly.
- **Pinned by:** `core/traits/__tests__/maneuverTemplate.test.ts` — the real character, the
  agrees-with-siblings property, a hand-built unresolved maneuver (`useweapon: false`, so it
  would otherwise take the damage branch), and a control that `aoe`'s Choke Hold still rolls
  damage, so the guard cannot silence a working maneuver.

### Original entry (for reference)

## H4 (original) — `Maneuver.roll()` crashes on an unresolved-template maneuver

- **Where:** `core/traits/maneuver.ts` `roll()` (legacy `decorators/Maneuver.js`). The
  guard is `hasOwnProperty('effect') && hasOwnProperty('template')`, but a maneuver can
  carry a `template` property whose value is `undefined` (its xmlid didn't resolve to a
  template entry). `trait.template.doesdamage` then throws.
- **Legacy:** throws the identical `Cannot read properties of undefined (reading 'doesdamage')`.
- **Correct:** guard the `template` value (not just the property), e.g. `trait.template &&
  trait.template.doesdamage`, and fall back to the delegated roll.
- **Corpus impact:** triggered by `tazimmaad`'s `JAB` maneuver (effect `"[NORMALDC] Strike"`,
  unresolved template). The decorator golden master treats "both engines throw the same
  error" as a match; the corrected behaviour needs a purpose-built test.
- **Fix + verify:** add the truthy `template` guard; hand-built maneuver with an unresolved
  template asserting the delegated roll; drop the `safeRoll` tolerance for this case.

## U2 — `getMultiplications(0, …)` returns `-Infinity` — ✅ FIXED

**Fixed.** `getMultiplications` now returns `0` unless `total > 0`, which also absorbs the
negative and `NaN` totals that previously yielded `-Infinity`/`NaN`. The callers were left
alone deliberately: guarding `levels > 0` at each call site (as `baseCost.ts:103` does) would
have fixed the two known ones and left the next one to rediscover this, whereas the helper
returning `-Infinity` for "no levels" was the actual defect.

- **Verified:** `mark-li-v5a-433`'s "Gecko pads" now costs **11** (`basecost 10` + `0` + the
  trailing `+1`), and renders `11` on the sheet where it rendered the literal string
  `-Infinity`. The corpus-wide sweep for non-finite costs — which is how this was found —
  is now clean.
- **Pinned by:** `core/traits/__tests__/multiplierCost.test.ts` (the character, end to end,
  plus a standing sweep guarding against a new non-finite cost) and the non-positive cases
  in `core/util/__tests__/common.test.ts`. The decorator golden master skips exactly this
  trait via `U2_DIVERGENCE` and still compares every other trait in the corpus to legacy.
- **U3 is untouched and still open:** it lives in the same function but is a different
  quirk (float overshoot on exact powers of a non-2 step), is latent, and gets its own
  commit. `common.test.ts` pins the current, still-wrong `getMultiplications(9, 3) === 3`
  so the U3 fix has to come back and change it deliberately.

### Original entry (for reference)

## U2 (original) — `getMultiplications(0, …)` returns `-Infinity` (**active bug**)

- **Where:** `core/util/common.ts` `getMultiplications` / `getMultiplierCost` (legacy
  `Common.js`). `Math.log(0)` is `-Infinity`, so `Math.ceil(-Infinity / Math.log(step))`
  is `-Infinity` and the caller adds it straight into a cost.
- **Legacy:** same — `Clinging.js` is byte-identical, so the shipped app has this too.
- **Correct:** zero levels buys zero multiplications, so the multiplier term must
  contribute **0**. (`getMultiplications(1, …)` is already `0`; `0` is the same case.)
  Negative and `NaN` totals are equally undefined and should not yield `±Infinity`.
- **Corpus impact:** **triggered by `mark-li-v5a-433`** — its `Gecko pads` power is
  `CLINGING` with `levels: 0`, and the 5E/6E `clinging` template is
  `basecost 10 / lvlval 3 / lvlcost 1`. So `cost()` = `10 + getMultiplierCost(0, 3, 1) + 1`
  = `-Infinity`; `activeCost()`/`realCost()` follow, and the sheet renders the literal
  string `-Infinity` as that power's cost. The decorator golden master is blind to it
  (legacy is equally wrong). Correct value: **11** (`10 + 0 + 1`) — noting the trailing
  `+1` in `Clinging.cost()` is a separate, unreviewed legacy oddity.
- **Callers at risk:** `powers/clinging.ts:23` and `talents/lightningReflexes.ts:35` pass
  `levels` with **no `> 0` guard**; `baseCost.ts:103` guards with `levels > 0` and so is
  safe. `perks/followerAndBase.ts:27` / `powers/duplication.ts:32` pass `trait.number`.
- **Fix + verify:** guard the total in `getMultiplications` (`if (!(total > 0)) return 0;`,
  which also absorbs negatives/`NaN`); unit test pinning `getMultiplications(0, 3) === 0`;
  correctness test pinning `Gecko pads` at 11; re-base the decorator golden master for
  `mark-li-v5a-433` as an intentional divergence linking here. *(That pin now reads **10** — the
  trailing `+1` this entry flagged as "a separate, unreviewed legacy oddity" turned out to be a
  real bug, fixed as **H10**.)*

## U3 — `getMultiplications` overshoots on exact powers of a non-2 step — ✅ FIXED

**Fixed.** `total` is an exact power of `step` iff `step ** n === total`, so the code now asks
that question directly rather than rounding a log:

```ts
const exact = Math.log(total) / Math.log(step);
const nearest = Math.round(exact);

return Math.pow(step, nearest) === total ? nearest : Math.ceil(exact);
```

- **Deviates from the plan below, deliberately.** That said "epsilon-snap"; this is exact
  instead. An epsilon has to be *chosen*, and it gets less safe as the exponent grows — a
  genuinely fractional exponent at a large magnitude can fall within any fixed epsilon of an
  integer and be snapped down wrongly. Integer powers are exact in a double up to 2^53, far
  beyond anything the template data holds (`lvlval` tops out at 16000), so the direct test has
  no tuning parameter and no failure mode here. Non-integer/negative `step` keeps legacy's
  behaviour: `Math.log` of a negative is `NaN`, and `NaN` propagates exactly as before.
- **Corpus impact: none, as predicted.** Both golden masters passed **unchanged, with no
  re-base** — which is the evidence that this was latent rather than active. Compare U2, which
  shared this function and required one.
- **It was reachable, not theoretical.** `lvlval` takes 3, 5, 7, 9, …, so e.g. a Clinging
  bought at 9 levels (`lvlval 3`) was charged for 3 multiplications instead of 2 — one
  `lvlcost` of silent overcharge. `getMultiplierCost(9, 3, 4)` is now 8, was 12.
- **Pinned by:** `core/util/__tests__/common.test.ts` — the exact powers that were wrong
  (9/3, 27/3, 125/5, 49/7), base 2 which was always right, and genuine fractions that must
  still round up (10/3, 5/2, 126/5). The old entry's failing-by-design pin
  (`getMultiplications(9, 3) === 3`) is gone, having done its job of forcing this fix to be
  deliberate.

### Original entry (for reference)

## U3 (original) — `getMultiplications` overshoots on exact powers of a non-2 step

- **Where:** `core/util/common.ts` `getMultiplications` — `Math.log(total) / Math.log(step)`
  is inexact, so an exact power can land just above the integer and `Math.ceil` rounds it up:
  `Math.log(9) / Math.log(3)` is `2.0000000000000004` → **3**, not 2. Likewise
  `(27, 3)` → 4 (want 3) and `(125, 5)` → 4 (want 3). Base 2 is exact in binary and unaffected,
  which is why this has gone unnoticed.
- **Legacy:** same.
- **Correct:** snap to the nearest integer when the quotient is within float noise, then
  `ceil` only genuine fractions.
- **Corpus impact:** **not currently triggered.** Instrumenting `getMultiplierCost` across all
  37 fixtures yields 572 calls over just three step values (1, 2, 3); `step: 1` is
  special-cased and `step: 2` is exact, and the only totals paired with `step: 3` are 0, 10
  and 20 — none an exact power of 3. It is **reachable, not theoretical**: `lvlval` in the
  template data takes values 3, 5, 7, 9, … so a character with e.g. Clinging at 9 levels
  (`lvlval 3`) would be silently overcharged by one `lvlcost`.
- **Fix + verify:** epsilon-snap before `ceil`; unit tests pinning `(9, 3) === 2`,
  `(27, 3) === 3`, `(125, 5) === 3` while keeping `(5, 2) === 3` (a real fraction still
  rounds up). Existing `common.test.ts` coverage only exercises the default `step: 2`, so
  it cannot catch this. No golden-master re-base expected (no corpus divergence) — verify
  by re-running it.

## H13 — A Multipower slot's divisor is always 10 — ✅ **fixed**

- **Where:** `core/traits/powers/multipowerItem.ts` —
  `(this.characterTrait as unknown as {ultraSlot?: boolean}).ultraSlot ? 5 : 10`.
- **Legacy:** same.
- **Now:** `this.characterTrait.trait.ultraSlot === false ? 5 : 10` — **fixed ÷ 10, variable ÷ 5**.

**Two things were wrong with that line, and only one of them looked arguable at the time.**

The unambiguous one: `ultraSlot` is a field on the **trait**, not on the `CharacterTrait` wrapper.
`CharacterTrait` carries `trait`, `listKey`, `getCharacter` and `parentTrait` — no `ultraSlot`, and
the cast is what stopped the compiler saying so. The read was therefore always `undefined`, the
condition always false, and **every Multipower slot divided by 10** regardless of its kind.

The one this entry called arguable: the branches were inverted. They were — and the evidence turned
out to be sitting in legacy itself. Legacy's `attributes()` reads:

```js
let slotType = this.characterTrait.ultraSlot ? 'Variable' : 'Fixed';
if (isFifth(...)) { if (this.characterTrait.ultraSlot) slotType = 'Flexible'; }
```

So legacy believed `ULTRA_SLOT="Yes"` meant the *flexible* kind, and priced it accordingly at ÷5.
It has the terminology backwards: **an ultra slot is the fixed kind** — one power, at full value,
one at a time — and 6E renamed ultra → *fixed* and multi → *variable*. **The ratios were right and
attached to the wrong branch.** Worth noticing on its own: the bug was never in the arithmetic, so
no amount of staring at the numbers would have found it.

**The fixed side is measured, not argued.** This entry asked for a rulebook and the corpus answered
instead. All 75 multipower slots in the 37 fixtures are `ULTRA_SLOT="Yes"`, as is every slot in all
82 `.hdc` files on the machine — so pricing them tests the *fixed* divisor against characters HERO
Designer itself balanced. Each one's spend against its declared `<BASIC_CONFIGURATION>`:

| Fixture | ÷10 (fixed) | ÷5 |
|---|---|---|
| junkyard | **0** | +18 |
| spyder2022 | **−2** | +39 |
| starborne | **−4** | +25 |
| greyman | **−7** | +11 |
| twilight | **+7** | +38 |
| psi-blade6 | **+20** | +42 |

÷10 lands one fixture exactly on budget and the rest within a few points, across both editions; ÷5
puts every one of them over. Real characters come in at or slightly under their allowance, not
11–39 points past it. **÷10 is the fixed divisor**, which leaves ÷5 — the number legacy already had
— for the variable kind.

Only an explicit `ULTRA_SLOT="No"` reads as variable. An absent field stays **fixed**: HERO Designer
writes the attribute on every slot it emits, so absence means malformed input, and the safe answer
there is the behaviour that shipped for the whole life of the port.

- **Corpus impact:** none, and that is now checked rather than assumed — every fixture slot is
  fixed, prices at ÷10 before and after, and no golden master moved. Which is exactly why this
  needed its own test rather than a fixture.
- **Also restored:** the **Slot Type** line on the sheet, which legacy had and the port dropped —
  terminology corrected, and named per edition (5E *Ultra*/*Multi*, 6E *Fixed*/*Variable*). Without
  it, two slots costing different numbers look identical on the card. The decorator golden master
  compares costs and rolls, not attributes, so this needed no re-base.
- **Consequence for authoring:** the gate is lifted. `core/authoring` now offers both kinds on a
  Multipower slot — and only there, since an Elemental Control slot pays what it exceeds the pool
  by and a VPP's slots are prefabs.
- **Verified by:** `core/traits/__tests__/multipowerSlot.test.ts` — both kinds, mixed in one pool,
  the rounding boundary (75 ÷ 10 truncates to 7, so the two are not simply a factor of two apart),
  the absent field, the source round-trip, and a regression guard that the two kinds price
  *differently at all* — the assertion nothing in the suite could previously make.

## U1 — `capitalize` only upper-cases the first character

- **Where:** `core/util/common.ts` `capitalize` — `word.slice(1)` keeps the original
  tail rather than lower-casing it (`capitalize('SUCCESS') === 'SUCCESS'`).
- **Legacy:** same. Only used by the app-layer toast (never by the engine); exported
  from `core/util` but currently unused by core.
- **Correct:** `word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()` — or drop
  it from `core/util` since only the app uses it.
- **Corpus impact:** none (not on any golden-mastered path).
- **Fix + verify:** update `common.test.ts`. Lowest priority.
