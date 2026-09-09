<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

The combined patch list for the whole distance a production user travels: from
**legacy 2.1.13** (versionCode 59, the last build the public ever got) to
**2.9.0** (versionCode 70, accepted in both stores).

This is the engineering-side companion to `RELEASE_NOTES_2.9.0_PUBLIC.md`. That
file is 500 and 4000 characters of store copy for a stranger; this one is the
whole ledger, so nothing gets quietly dropped when the copy gets trimmed. Per-release
tester notes live in `RELEASE_NOTES_2.5.0.md`, `2.6.0`, `2.8.0` and `2.9.0` — there
are none for 2.4.x or 2.7.x, and the entries below are reconstructed from the log.

Audience: whoever writes the next store listing, answers "when did that change?",
or triages a bug report from someone who skipped eleven versions in one tap.
-->

# 2.1.13 → 2.9.0 — combined patch list

## What the span actually is

Production has been sitting on **legacy 2.1.13 / versionCode 59** since 2025-01-28.
2.9.0 is **versionCode 70**. Eleven codes, but only two of the intervening builds
were ever public, and neither of those is on the path:

| Code | Version | What it was | Who saw it |
|---|---|---|---|
| 59 | 2.1.13 | legacy | **everyone — this is the baseline** |
| 60–61 | 2.2.0 / 2.2.1 | legacy | beta only |
| 62 | 2.3.0 | legacy — last legacy build | beta only |
| 63–69 | 2.4.0 – 2.8.0 | rebuild | internal testing only |
| 70 | 2.9.0 | rebuild | **everyone — this is the target** |

So for a real user this is **not eleven increments, it is one**: legacy 2.1.13
replaced wholesale by a from-scratch rebuild. Every line below is new to them,
including the ten engine corrections that internal testers absorbed back in 2.5.0.

**The two legacy beta builds are not part of the delivered patch.** 2.2.0–2.3.0
carried a dark/light theme, a card UI on character select, a `FlatList` for large
trait lists, combat-screen and effect-roll fixes, and the first SQLite foundation
(settings and statistics moved into a database). All of it was superseded by the
rebuild rather than carried across — the rebuild was built on an orphan branch and
shares no commits with it. (It is now `master`; the pre-rebuild history is on `legacy`.)
The *ideas* survived (theming, SQLite, card lists); the code did not.

## The release spine

| Version | Code | Date | Schema | Headline |
|---|---|---|---|---|
| 2.4.0 | 63 | 2026-07-14 | 1–4 | Cutover: the rebuild replaces the legacy app |
| 2.4.1 | 64 | 2026-07-14 | 4 | Import hotfix (spaces in filenames) |
| 2.5.0 | 65 | 2026-07-15 | 5 | Random characters (5E); ten engine corrections |
| 2.6.0 | 66 | 2026-07-15 | 6–7 | 6E random characters; portrait framing |
| 2.7.0 | 67 | 2026-07-16 | 7 | Endurance tracking; hand of five; H11 |
| 2.7.1 | 68 | 2026-07-23 | 7 | Modal accessibility; CI/E2E hardening |
| 2.8.0 | 69 | 2026-08-08 | 8 | In-app character authoring; Quick Pick; H2 |
| 2.9.0 | 70 | 2026-08-09 | 8 | Authoring completed; four 2.8.0 bugs fixed; H13 |

**One correction to the drafted notes:** `RELEASE_NOTES_2.6.0.md` headlines the
hand-of-five deal, rolling Strength off the sheet, and the H11 half-die fix. All
three landed **after** the `v2.6.0` tag (`8416009`, `a823be2`, `c7d6ea7`) and
actually shipped in **2.7.0 / versionCode 66→67**. Immaterial to a 2.1.13 user —
everything is in 70 — but don't cite 2.6.0 as the "since" version for any of them.

---

## 1. Data — what happens on first launch

- **`migrateV1` runs once**, on first open, and brings across what the legacy app
  saved: characters, settings, dice statistics. Nothing to export, nothing to
  re-import. Legacy `.hsmc` files on disk are authoritative; AsyncStorage supplies
  the slot and active-character pointers.
- **Storage is SQLite** (`op-sqlite`) with a versioned migration chain, replacing
  AsyncStorage plus loose files. Schema 1 → 8 across the span:
  1 characters/settings/statistics/random_hero/app_state · 2 combat_state ·
  3 drop `slot` · 4 `accessed_at` · 5 `origin` + `recipe` · 6 portrait focus ·
  7 portrait scale · 8 `source`.
- **Portraits moved to an image store** on disk, keyed to the character.
- **Character slots are retired.** Legacy's five numbered slots become a library
  plus one active character (migration 003). Quick Pick fills the hole they left.
- **`random_hero` is preserved but dead.** `migrateV1` still writes the old app's
  saved random hero there and nothing reads it. Data preservation, not a feature.

**This is the one code path with real first-launch risk**, and it runs exactly once
per device over data we have never seen. Staged rollout, per the public notes.

## 2. Character building (new — 2.8.0, completed 2.9.0)

Characters → **New**. A form priced live by the same engine that reads a `.hdc`, so
its total is the total HERO Designer would show.

- **Characteristics** typed as totals; in 5E the figured ones (PD, ED, SPD, REC,
  END, STUN) do their own arithmetic.
- **Skills, perks, talents** — the characteristic a skill rolls against, familiarity,
  levels. Plus the custom entries.
- **Powers with advantages and limitations** — the full hundred-odd, with their
  options and adders; active and real cost move as you add them.
- **Frameworks** — Multipower, Elemental Control, Variable Power Pool, with powers
  inside. **Multipower slots can be fixed or variable** (5E: ultra / multi;
  6E: fixed / variable), ÷10 and ÷5 respectively, with the kind on the slot row and
  a **Slot Type** line on the sheet.
- **Martial arts, equipment, complications/disadvantages.**
- **Every trait in both editions is offered.** 2.8.0 shipped with 21 withheld;
  2.9.0's withheld list is empty — Weapon/Transport Familiarity, Weapon Element,
  Barrier, Duplication, Endurance Reserve, Flash, Compound Power, Multiform, Summon,
  Autofire Skills, Defense Maneuver, Rapid Attack, Two-Weapon Fighting, Cramming.
- **Point allowance and experience.** Pick a power level or type your own; 5E quotes
  "base points" (disadvantages add to it), 6E quotes "total points" (complications
  grant nothing). Anything past the allowance is earned experience, shown on the
  nameplate as **400 + 25 pts**.
- **Each section is a list; a row opens that one trait on its own page.**
- **Authored characters stay editable**, rebuilt from their stored `source`
  (`ParsedCharacter`) — `data` holds engine output and does not round-trip.
- 2.9.0: the catalogue sorts by name.

## 3. Random characters (new — 2.5.0 / 2.6.0 / 2.7.0)

Clean-room, not ported. Emits a `ParsedCharacter` and runs it through the same
engine, so a generated character is priced and saved exactly like an imported one.

- **5E Low Powered (250)** and **6E Standard (400)**, chosen from pills in the
  Generate dialog, defaulting to the edition set in Settings.
- **Deals a hand of five**, all distinct archetypes, with a stat line to argue over
  (`10d6 · SPD 5 · OCV 7 / DCV 7 · DEF 28`). **Nothing is saved until you pick one.**
  Roll Again deals five more. Uniform, not weighted — uniform is the
  minimum-collision distribution.
- **Eleven archetypes and eleven professions per edition.** The 6E half is authored
  from scratch (there is no legacy 6E prose), benchmarked against real 400-point
  characters and scored against the Rule of X (±10%).
- **Two deliberate 6E constraints, encoded in the data:** no VPPs (multipowers
  instead) and no CSLs at creation (re-invested in base OCV/DCV).
- **Generated characters are editable** — rename, re-roll archetype, retrain
  profession, re-pick special FX, name the `Lang:` and `SS:` skills. Editing revises
  the recipe and rebuilds; there is no partial mutation path.
- Imported `.hdc` files stay **read-only** — they are the player's file.

## 4. Combat and Endurance (new — 2.7.0)

- **Mutable combat tracker** on the Combat tab: BODY, STUN, END, with status effects.
- **END is spent from a shared pool**, tapping a power's END on the sheet;
  the pool burns STUN when it runs dry, and toasts on low/empty.
- **Each power's END cost is derived and shown**; **Strength costs END to use**.
- **Movement costs END**, tappable per mode. 5E charges on the metre-equivalent
  distance (5E movement is in inches).
- The END chip flashes on spend for local feedback.

## 5. Character sheet

- Rendered from the engine's own output, laid out like the printed sheet.
- **Tap any roll to open the dice roller pre-filled; long-press to roll inline.**
- **Strength damage** shown under the characteristic and rollable (legacy had this;
  the port had lost it).
- **Combat and movement tab**; martial-arts maneuvers as a two-row combat table,
  with complex effects in notes and dice kept in Damage.
- **Flip cards** — mechanical writeup on the front, definition on the back.
- **Alternate Identity (OIHID)**: alias shown, a form toggle, and suppression that
  covers combat, movement and all totals. The toggle appears only on characters that
  actually have an OIHID trait. *(Known: it is component-local and resets to on at
  every mount, where legacy persisted `showSecondary`.)*
- **Nameplate** carries the point total and power-level tier, per edition, and says
  "base + earned" when a character is over their allowance.
- **Framework slots nest inside their framework** (H2) — see §9.

## 6. Quick Pick, Home and the character list (new — 2.4.1 / 2.8.0)

- **Quick Pick: a 3×3 grid of nine characters**, inline on Home and behind a handle
  at the bottom of the character sheet. Tapping a slot makes that character active
  and opens their sheet, *replacing* the current one rather than stacking.
  **Long-press a slot to pin**; unpinned slots fill themselves from recents, a
  character only ever appears once, and deleting a pinned character empties and
  refills the slot. This is legacy's bottom-of-screen character switcher, back.
- The sheet's panel **slides rather than drags** — deliberate; it snaps if Screen
  animations are off.
- **Home is a hub** with a "Recent" list that reorders as you open characters and
  drops one when you delete it (legacy showed launch-time order all session).
- **Delete a character**, behind a confirmation, with a trash button on each row and
  long-press — it takes the portrait with it.
- Character list on the in-house design system; card-shaped rows.

## 7. Portraits (new — 2.6.0)

- **Framing on import**: drag to choose which part of the square shows, pinch or
  +/− to zoom. Portraits were always centre-cropped before.
- Existing portraits are untouched and still centre — reframe if you like.
- Two RN traps fixed along the way (the framer shipped broken twice): a multi-touch
  move never reaches `onPanResponderMove`, and `nativeEvent.touches` doesn't
  reliably carry a second finger. See CLAUDE.md.

## 8. Dice, statistics, settings, platform

- **One dice screen** (`DiceScreen`) in place of legacy's five (Skill, Hit, Damage,
  Effect, Result), with a partial-die control.
- **Statistics** accumulate as you roll and have their own screen; the legacy
  statistics rows migrate across, and a crash on partial/legacy-shaped rows is fixed.
- **Settings**: live theme toggle, screen-animation toggle wired to transitions,
  and a **text-size setting that scales the whole UI**.
- **Import** a `.hdc` through the system file picker; **file paths are URI-decoded**,
  so a filename with spaces imports (2.4.1 hotfix).
- **Accessibility**: modal content is exposed to VoiceOver/TalkBack
  (`accessible=false` on backdrop and card) — 2.7.1.
- **Icons**: app icon carried over from legacy, plus an adaptive launcher icon so
  Android 8+ masks it to the device shape.
- **iOS**: iPad multitasking orientations, export-compliance flag, and a committed
  privacy manifest.
- **Under the hood**: RN 0.79.2 + TypeScript, a three-layer architecture with a pure
  `core/` enforced by ESLint, no Redux (React context + local state), Maestro E2E on
  both platforms in CI with a pixel-diff gate on the character sheet.

## 9. Engine corrections — the part that changes numbers

`core/` reproduced the legacy engine byte-for-byte first, so the golden masters prove
parity, not correctness. Fourteen ledger entries have since been fixed. **A 2.1.13
user gets all of them at once**, and roughly a third of real characters read
differently than they did. Where we now disagree with the old app, we agree with
HERO Designer.

| # | Fix | Shipped | User-visible effect |
|---|---|---|---|
| H8 | Unusual defenses now obey `affectsPrimary`/`affectsTotal` | 2.5.0 | **~14 of 37 fixtures — the big one** |
| H6 | Unusual-defense duplicates read off the collapsed array | 2.5.0 | defensor, m-championsmush |
| H7 | Resistant Protection's `mdlevels` no longer feeds every unusual-defense total | 2.5.0 | defensor, adamantine |
| H3 | Duplicate powers counted in char/defense totals | 2.5.0 | junkyard, mark-li-v5a-433 |
| H5 | VPP contents no longer counted toward totals | 2.5.0 | adamantine (Leaping), m-championsmush |
| H9 | Enhanced Perception priced by what it enhances (`allcost`) | 2.5.0 | adamantine 9→27, jane-fawn 2→6 |
| H10 | Clinging drops a stray `+1` | 2.5.0 | mark-li, aoe, spyder2022 |
| H4 | A maneuver with an unresolved template no longer degrades to a blank 0-cost row | 2.5.0 | tazimmaad ("Cut") |
| U2 | A zero-level multiplier buys nothing, not `-Infinity` | 2.5.0 | mark-li-v5a-433 (Gecko pads) |
| U3 | `getMultiplications` off-by-one on exact powers | 2.5.0 | latent — no corpus impact |
| H11 | Hand-to-Hand Attack keeps the half-die it computes | **2.7.0** | damage, not cost, on an HA landing on a half |
| H12 | A free skill under a Skill Enhancer stays free | 2.8.0 | greyman, m-championsmush, twilight |
| H2 | Traits sort by position, so a framework keeps its slots | 2.8.0 | **27 of 37 fixtures — layout only, no cost change** |
| H13 | A Multipower slot's divisor follows its kind | 2.9.0 | latent — every real slot is fixed |

**Still open, none corpus-triggered:** T1–T4 (template output only), H1 and U1
(cosmetic). One rules question is pinned deliberately in `handToHandAttack.ts` —
whether `+½d6` advances one step or two. See `docs/KNOWN_DEVIATIONS.md`.

**Authoring-only cost changes (2.9.0):** a **Variable Power Pool** and a **Compound
Power** were each counted twice — container *and* contents. A 50-point pool with two
powers in it read 165 where it costs 75. Characters *authored* with either read lower
now, correctly, and their stored earned-XP may drop with them. Imported and generated
characters are unaffected.

**Four bugs were live in 2.8.0 and are fixed in 2.9.0** — relevant only when reading
a tester report from that build: Damage Negation and Possession could not be built at
all; no attack could buy a half-die (which also meant Animal Handler, Navigation,
Weaponsmith and Survival could only be bought empty, an Area Of Effect couldn't be
Selective, Charges couldn't take Clips, and a Focus couldn't be Multiple Foci); and
the VPP double-count above. No 2.8.0 build reached the public.

## 10. What a 2.1.13 user loses

Named here so a correct one-star review isn't a surprise.

- **Cost Cruncher is gone.** Legacy had `CostCruncherScreen`; it is the last screen
  outstanding and genuinely on the roadmap.
- **Dice sounds are gone.** Legacy's `playSounds` / `onlyDiceSounds` drove
  `SoundPlayer`; dropped on purpose in `fbccfc7` and not coming back. Mitigating:
  legacy defaulted `playSounds` to 0, so most users never heard them.
- **Character slots / loadouts are gone**, replaced by the library plus an active
  character. Quick Pick fills the "my five characters" hole.
- **Five dice screens are now one.**
- **Shake-to-roll is gone — and was already gone.** `react-native-shake` came out in
  `3691508` (March 2023); no tag from `v2.1.3` on contains it, so the live 2.1.13
  build has no shake handler either. The store listing has been advertising it for
  years. Nothing is lost; the listing line was the bug.

## 11. Still open at 2.9.0

- **Cost Cruncher** — the only screen not rebuilt.
- **No export.** An authored character lives on the device; uninstalling loses it.
- **No reordering** traits within a list.
- **Quick Pick is nine slots and one page** — no pagination, no drag-to-rearrange.
- **Familiarity sub-categories** aren't offered (buy "Common Melee Weapons" whole,
  not the weapons under it) — gated on HD's `SELECTED` semantics.
- **Sense enhancements** (Telescopic, Discriminatory, Microscopic…) aren't in the
  power list; they belong to a sense, not to a sheet.
- **Equipment doesn't add to your defences** — the engine has never counted equipment
  toward totals. Whether it should is an unsettled rules question; the app warns you.
- **Each archetype has exactly one powerset**, so two Bricks differ only in skills.
  More powersets is the next authoring job.
- **5E archetypes have never been graded against the Rule of X** — lifted from legacy
  prose, and the nearest model campaign is 225, not 250.
- **`POWER_LEVELS` names 5E Standard (350) and 6E Low Powered (300)** with no authored
  content; the dialog deliberately doesn't offer them.
- **The store listing still sells the legacy app** — description and screenshots
  predate every screen in this build. Draft copy is in
  `RELEASE_NOTES_2.9.0_PUBLIC.md`.
