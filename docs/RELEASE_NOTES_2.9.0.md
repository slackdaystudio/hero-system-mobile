<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Draft notes for the 2.9.0 internal-testing release. Paste into Play Console →
Internal testing → release notes (the short version), and send the long version
to testers however you normally reach them.

Assumes testers are coming from 2.8.0. If anyone is jumping straight from 2.7.x,
point them at RELEASE_NOTES_2.8.0.md first — the framework-nesting change (H2)
is the headline there and this build doesn't repeat it.

The thing to make sure testers read: **four things that were broken in 2.8.0 are
fixed**, and two of them were "you cannot build this character at all". Anyone
who hit those and worked around them should undo the workaround.

No schema change and no cost changes on imported or generated characters — the
one exception is spelled out under Fixed, and it only touches characters the
tester *authored* with a Variable Power Pool.
-->

# 2.9.0 — release notes (draft)

## Short version (Play Console, ~500 char limit)

```
Character building is finished: every skill, perk, talent, maneuver and power in
both editions can now be built. That's Weapon Familiarity, Barrier, Duplication,
Endurance Reserve, Flash, Compound Powers and the rest.

Multipower slots can now be variable, not just fixed.

Fixed: Damage Negation and Possession couldn't be built at all, no attack could
buy a half-die, and a Variable Power Pool charged you twice for its contents.
```

## For testers

**No costs change on characters you imported or generated.** The engine prices them
exactly as 2.8.0 did. If a cost moves on one of those, that's a real regression and we
want to hear about it.

**One exception, and only for characters you built yourself with a Variable Power Pool** —
see Fixed. Its points were being over-counted, so it will now read *lower*, correctly.

**No schema change.** Stays at 8, so upgrading is uneventful.

### Fixed: four things that were broken in 2.8.0

These are the ones to check first, because two of them meant "this character cannot be
built" rather than "this number is wrong".

- **Damage Negation and Possession could not be built at all.** Both need you to answer
  something — how many DCs, how many points of Mind Control — and the form had no control
  that could answer it. It told you the power was incomplete and gave you no way to
  complete it. Both work now.
- **No attack could buy a half-die.** `+½d6` on a Blast, Killing Attack, Drain, Aid, Ego
  Attack — the option simply wasn't drawn. The same gap meant **Animal Handler,
  Navigation, Weaponsmith and Survival could only be bought empty** (they're bought *by
  category*, and no category could be picked), and on advantages it meant **an Area Of
  Effect couldn't be made Selective**, Charges couldn't take Clips, and a Focus couldn't
  be Multiple Foci. Those last ones changed what the power *cost*, not just what it did.
- **A Variable Power Pool charged you twice for what was in it.** A VPP's pool and its
  control are the whole price — the powers you build out of it are free. The meter was
  adding each one on top: a 50-point pool with two powers in it read **165 points when it
  costs 75**. If you built a VPP character, it just got cheaper, and that's the correct
  price.
- **A Compound Power was counted twice too**, for the same reason — the container and its
  contents are the same points.

### New: every trait can now be built

2.8.0 shipped with a list of things the builder couldn't do yet, and the **Add** field told
you how many were missing from each list. **That list is now empty.** Everything in both
editions is available:

- **Weapon Familiarity, Transport Familiarity, Weapon Element** — pick the categories you
  want, each priced as you tick it.
- **Barrier** — its defences and its size (length, height, and in 6E BODY and width).
- **Duplication** — the points your duplicate is built on, and how many of them.
- **Endurance Reserve** — the reserve and its Recovery.
- **Flash** — pick the sense group you blind, and any extra senses.
- **Compound Power** — one purchase that does several things at once. Add powers to it and
  it costs their total.
- **Multiform, Summon, Autofire Skills, Defense Maneuver, Rapid Attack, Two-Weapon
  Fighting, Cramming**, and the **custom** skill/perk/talent entries.

If you tried to build a character in 2.8.0 and gave up because something was missing, this
is the build to try it again on.

### New: Multipower slots can be variable

A Multipower slot is now a choice, and the names follow your edition — **5E** picks between
an **ultra** and a **multi** slot, **6E** between **fixed** and **variable**.

- A **fixed** slot runs at full value, one at a time, and costs a tenth of the power.
- A **variable** slot takes a share of the reserve and runs alongside its neighbours, and
  costs a fifth.

The kind shows on the slot's row so you can read a whole Multipower at a glance, and the
sheet now has a **Slot Type** line on each slot's card. The old app had that line and the
rebuild had lost it.

**This changes nothing about characters you already have.** Every slot in every `.hdc`
we've ever seen is a fixed slot, and fixed slots cost exactly what they did before.

## What to hammer on

1. **Rebuild something you couldn't finish in 2.8.0.** That's the whole point of this
   build. If you abandoned a character because Weapon Familiarity or a Barrier wasn't
   there, finish it now.
2. **Build a character in HERO Designer and again in the app, and compare the totals.**
   Still the most valuable bug you can file. Now that everything is available, the
   interesting cases are Barrier, Endurance Reserve, Flash and Compound Powers — say which
   power when the numbers disagree.
3. **If you built a VPP character, open it and look at the total.** It should be lower than
   it was, and it should match what HERO Designer says. Check the nameplate too: if it was
   showing earned experience it may have been inflated.
4. **Take a Multipower and give it one fixed and one variable slot.** The variable one
   should cost twice the fixed one — except where rounding intervenes, which is real and
   not a bug (a 75-point power is 7 as a fixed slot, not 7.5).
5. **Buy a half-die on something.** Then a Selective Area Of Effect. Both were unreachable.
6. **Upgrade, don't reinstall.** Nothing should move.

## Known gaps

Much shorter than last time:

- **Sub-categories under a Weapon or Transport Familiarity group aren't offered.** You can
  buy "Common Melee Weapons" as a whole (which is the usual purchase), but not the
  individual weapons under it. The groups that cost nothing on their own are hidden rather
  than shown as free — we'd rather offer nothing than a button that charges nothing and
  grants nothing. The underlying pricing needs checking before we open it up.
- **The sense enhancements** (Telescopic, Discriminatory, Microscopic and friends) still
  aren't in the power list. They belong to a *sense* rather than to a sheet, and are bought
  through the sense that carries them.
- **There's still no export.** An authored character lives on your device.
- **You still can't reorder** the traits in a list.
- **Quick Pick is still nine slots and one page.**
- Cost Cruncher still isn't built.
