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
| H3 | Char/defense totals skip **duplicate** powers | **real bug, active** | **yes — 17 fixtures** | hero query |
| U1 | `capitalize` only upper-cases the first char | cosmetic (app-only) | no | (unit test) |

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

## H3 — Characteristic/defense totals skip duplicate powers (**active bug**)

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

## U1 — `capitalize` only upper-cases the first character

- **Where:** `core/util/common.ts` `capitalize` — `word.slice(1)` keeps the original
  tail rather than lower-casing it (`capitalize('SUCCESS') === 'SUCCESS'`).
- **Legacy:** same. Only used by the app-layer toast (never by the engine); exported
  from `core/util` but currently unused by core.
- **Correct:** `word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()` — or drop
  it from `core/util` since only the app uses it.
- **Corpus impact:** none (not on any golden-mastered path).
- **Fix + verify:** update `common.test.ts`. Lowest priority.
