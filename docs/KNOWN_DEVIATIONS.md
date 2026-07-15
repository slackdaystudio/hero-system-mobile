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
| H2 | Trait sort uses a boolean-returning comparator | real bug | likely (trait order) | hero |
| H3 | Char/defense totals skip **duplicate** powers | ✅ **fixed** — was real bug, active | yes — junkyard, mark-li-v5a-433 | hero query (re-based) |
| H4 | `Maneuver.roll()` crashes on an unresolved-template maneuver | ✅ **fixed** — was real bug, active | yes — tazimmaad ("Cut") | traits (decorator, re-based) |
| H5 | VPP contents counted toward totals | ✅ **fixed** — was real bug, active | yes — adamantine (Leaping), m-championsmush | hero query / movement |
| H6 | Unusual-defense duplicates read off the collapsed array | ✅ **fixed** — was real bug, active | yes — defensor, m-championsmush | hero query (re-based) |
| H7 | Resistant Protection's `mdlevels` fed *every* unusual-defense total | ✅ **fixed** — was real bug, active | yes — defensor, adamantine | hero query (re-based) |
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

## H2 — Trait sort uses a boolean-returning comparator

- **Where:** `populateTrait` — `.sort((a, b) => Number(a.position > b.position))`
  (legacy returns the raw boolean; V8 coerces to 0/1). Never returns a negative, so
  it is not a correct comparator — a partial/incorrect ordering.
- **Legacy:** same.
- **Correct:** `.sort((a, b) => a.position - b.position)`.
- **Corpus impact:** likely changes trait **order** for some characters (affects
  display order and any position-indexed logic; point totals are order-independent).
  Confirm which fixtures reorder.
- **Fix + verify:** proper numeric comparator; unit test with shuffled positions;
  re-base hero golden master for reordered characters.

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
  `mark-li-v5a-433` as an intentional divergence linking here.

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

## U1 — `capitalize` only upper-cases the first character

- **Where:** `core/util/common.ts` `capitalize` — `word.slice(1)` keeps the original
  tail rather than lower-casing it (`capitalize('SUCCESS') === 'SUCCESS'`).
- **Legacy:** same. Only used by the app-layer toast (never by the engine); exported
  from `core/util` but currently unused by core.
- **Correct:** `word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()` — or drop
  it from `core/util` since only the app uses it.
- **Corpus impact:** none (not on any golden-mastered path).
- **Fix + verify:** update `common.test.ts`. Lowest priority.
