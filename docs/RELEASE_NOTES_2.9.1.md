<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Notes for **2.9.1** (versionCode 71) — two fixes, both reported from the field
against 2.9.0, and neither of them a cost change.

**This is a production release, not a tester build**, which is unusual for this
repo. 2.9.0 (versionCode 70) was accepted in both stores, so the people the boot
bug broke are production users coming from **legacy 2.1.13** — not the internal
testers, who migrated long ago and cannot hit it. `migrateV1` is guarded by the
`migrated_v1` flag in `app_state`, so anyone already on the rebuild never runs that
code again. The sheet fix, by contrast, is visible to **everyone**.

Three things to decide before shipping:

1. **Halt the 2.9.0 rollout first if it is still staged.** Every additional
   percentage point is more upgraders with large libraries, and for them the app
   does not open at all. This is the failure mode the 2.9.0 public notes warned
   about — "the one code path with real risk here runs exactly once per device, on
   first launch, over data you have never seen" — and it is exactly what happened.
2. **The affected users are not lost, and neither is their data.** The `.hsmc`
   files are untouched on disk and `migrated_v1` was never stamped, so 2.9.1
   imports them on the next launch with no action from the user. But see (3).
3. **Tell people NOT to clear app data or reinstall.** On Android both wipe
   `DocumentDirectory`, where the `.hsmc` files live — the only authoritative copy
   of their characters. That is the one action that turns a recoverable state into
   a permanent loss, and it is the first thing a frustrated user tries. If anyone
   already did it, their characters are gone; say so honestly rather than implying
   the update will bring them back.

On the sheet fix: it is **display only**. `attributes()` feeds no cost path, and the
decorator golden master now pins attributes alongside costs across all 37 fixtures,
so "did a total move?" has a mechanical answer and the answer is no. Say that
plainly — this project has trained its testers to report changed numbers, and this
build deliberately changes none.

Field limits: Play "What's new" is **500 characters**, App Store is **4000**. Both
render as plain text — no markdown.
-->

# 2.9.1 — release notes

## Play Console — "What's new" (≤500 characters)

```
Fixes a crash on startup. If the app showed an error about "CursorWindow" instead
of opening after you upgraded, this fixes it. Your characters are safe — they were
never deleted, and this restores them automatically. Please don't uninstall or
clear app data first.

Powers now show what they actually do. Teleportation, Flight and Stretching show
their distance, attacks show their dice, Barrier and Endurance Reserve show their
numbers. No character's cost changes.
```

## App Store — "What's New in This Version" (≤4000 characters)

```
Fixes a crash on startup that could stop the app opening after you upgraded from an
older version. Your characters are safe — they were never deleted, and this update
restores them automatically the first time you open it. If you have not opened the
app since updating, install this and it will work. Please don't uninstall or clear
the app's data before installing — that would delete the character files this
update is about to restore.

Powers now show what they do. A card for Teleportation, Flight, Tunneling, Gliding,
Swinging or Leaping shows how far it moves you and how fast. Stretching shows its
reach. Attacks show the dice they add. Barrier shows its defenses and dimensions,
Endurance Reserve its reserve and recovery, and around thirty other powers now
print the numbers that were missing from their cards.

No character's cost changes.
```

## Fixed: the app would not open after upgrading

The app stores your characters in two places while it upgrades: the character files
themselves, and a small index of which ones you had. On Android, that index is kept
somewhere with a hard 2 MB ceiling — and the old app tucked each character's
**portrait** into the index alongside its name. Five characters with portraits clears
2 MB comfortably.

When the app started, it read the index *before* the character files, and Android
refused to hand back anything that large. The error you saw is Android's own words
for that, passed straight through with nothing around it:

> Row to big to fit into CursorWindow requiredPos=0, totalRows=1

Because that happened before the app could record "the upgrade is done", it happened
**every time you opened it**, not just the first.

### Why most people never saw it

You had to be upgrading **from the old app** — and have enough characters, with
portraits, to clear the ceiling. Two groups were never at risk: anyone already on
2.5.0 or later (that upgrade ran once, long ago, and never runs again), and anyone
with a small library or characters without portraits.

That is also why it survived testing. A fresh install passes, an emulator passes, and
every internal tester had already migrated months earlier. **The only way to see this
bug is a real phone with a real old library on it**, which is a thing testing did not
have and production did.

### What changed

- The character files are read **first** now. They were always the authoritative copy
  — the index only ever said which character was active — so nothing was ever riding
  on the part that failed.
- The index is read a second way if Android won't hand it over, which recovers it
  rather than working around it.
- **A failed upgrade can no longer stop the app starting.** If any part of it fails,
  the app opens anyway and tries again next time.
- The error screen says what went wrong in English and offers a Try Again button,
  instead of printing a line of Android's internals.

## Fixed: powers that do something now say what they do

A Blast has always shown its damage as a die code you can tap. Teleportation showed
nothing — just a name and a cost. Stretching didn't show how far it stretched.

That was not two powers with two bugs. **Around thirty powers were printing nothing
on their cards**, and the reason is boring: a power's card has two halves — the dice
and rolls, and the written-out numbers beside them — and only the first half had been
rebuilt. Powers whose whole point *is* the second half looked empty.

This affects **every character you have** — imported, generated or built in the app.
Cards that were blank now have content on them.

What comes back:

- **Movement.** Flight, Gliding, Swinging, Teleportation, Tunneling and Leaping show
  their combat and non-combat distance, and the speed that works out to in km/h. In
  5E these are inches, in 6E metres, as they should be.
- **Stretching** shows its distance and its non-combat distance.
- **Attacks** show the dice they add, beside the rollable damage that folds in your
  STR — Hand-To-Hand Attack and Hand Killing Attack both.
- **Defenses.** Barrier shows its PD/ED, mental and power defense, its BODY and its
  dimensions. Force Field and Armor show theirs. Flash, Mental and Power Defense show
  their points — and a 5E Mental Defense includes the EGO/5 that 6E abolished.
- **Endurance Reserve** shows its reserve and its recovery.
- **The rest**, each showing the number it was hiding: Absorption, Clinging, Concealed,
  Damage Negation, Density Increase, Duplication, Enhanced Perception, Entangle, Extra
  Limbs, FTL, Knockback Resistance, Microscopic and Rapid senses, Multiform, Naked
  Advantages, Negative Skill Levels, Lack Of Weakness, Reflection, Regeneration,
  Shrinking, Summon, Telekinesis, Telescopic senses, and Variable Power Pools. Powers
  that do or don't count toward your totals now say which.

**No cost changes anywhere.** These are the words on the card, not the arithmetic
behind it — the app's cost engine is checked against 37 real characters on every
build, and this release moves none of their totals. If a cost *does* move, that is a
real regression and we want to hear about it.

## What to check

1. **Open it.** For anyone who was stuck, that is the fix.
2. **Your characters are all there**, with their portraits. Close it fully, open it
   again — still there, and it doesn't re-import.
3. **Open a character with a movement power** and look at the card. Flight,
   Teleportation, whatever you have. There should be distances on it now.
4. **Compare a total against HERO Designer.** Still the most valuable bug you can
   file — and in this build the totals should be *identical* to 2.9.0.
5. If you are not coming from the old app and have no interesting powers, this build
   should look the same as 2.9.0. If something else moved, tell us.

## If you already uninstalled or cleared app data

Then the character files are gone, and this update cannot bring them back — Android
deletes them along with everything else. If you still have the original `.hdc` files
from HERO Designer, import them again. Sorry — that one is on us for shipping a screen
that gave you nothing better to try.
