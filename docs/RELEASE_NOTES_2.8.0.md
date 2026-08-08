<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Draft notes for the 2.8.0 internal-testing release. Paste into Play Console →
Internal testing → release notes (the short version), and send the long version
to testers however you normally reach them.

Assumes testers are coming from 2.7.x. If anyone is jumping straight from 2.4.1,
point them at RELEASE_NOTES_2.5.0.md first — the cost changes are the headline
there, and this build doesn't repeat them.

The thing to make sure testers read: **frameworks look different now**. That is
H2, it is a fix, it applies to characters they already have, and it is the only
change here that touches something they were already looking at.
-->

# 2.8.0 — release notes (draft)

## Short version (Play Console, ~500 char limit)

```
Build a character in the app. Characteristics, skills, perks, talents, powers with
advantages and limitations, Multipowers, martial arts, equipment, complications —
priced live by the same engine that reads a HERO Designer file.

Pick your campaign's point allowance, or type your own. Anything you spend past it
is tracked as experience.

Also fixed: Multipowers, Elemental Controls and VPPs now show their slots INSIDE
the framework instead of loose beside it. Costs don't change.
```

## For testers

**No character costs change in this build.** 2.5.0 was the one that moved costs, and
nothing here changes how a point is priced. If a **cost** moves, that's a real
regression and we want to hear about it.

**But one thing about your existing characters does look different** — see Fixed,
below. It's a layout fix, not a cost change, and it's the first thing to check.

### New: build a character in the app

Characters → **New**. You get a form, and the app prices it as you type using the same
engine that reads a HERO Designer `.hdc` — so if it says 350 points, it means the
same 350 points HERO Designer would.

What you can build:

- **Characteristics** — typed as totals, the number you'd read off a sheet. In 5E the
  figured ones (PD, ED, SPD, REC, END, STUN) do their own arithmetic; you say what you
  want the total to be and the cost follows.
- **Skills, perks, talents** — pick from the rulebook, choose the characteristic a skill
  rolls against, take it at familiarity, buy levels.
- **Powers**, with **advantages and limitations** — Area Of Effect, Focus, and the other
  hundred-odd, with their own options and adders. Your Blast's active and real cost move
  as you add them.
- **Frameworks** — Multipower, Elemental Control, Variable Power Pool, with powers inside.
- **Martial arts** and **equipment**.
- **Complications** (or Disadvantages, in 5E).

Each section is a **list**, and tapping a row opens that one thing on its own page. The
form for a power can run long — a name, an option, levels, a defence split, adders, and
however many advantages — so it gets a page rather than being wedged into the list.

### New: your campaign's point allowance

Pick a power level, or type your own numbers. The two editions are quoted the way each
rulebook quotes them, and the labels say which:

- **5E** — "Base points", which your disadvantages then add to.
- **6E** — "Total points", with complications granting nothing.

**Anything you spend past the allowance is experience.** That's what experience is: a
character costing more than their starting points has earned the difference. The meter
says "25 experience" rather than telling you off, and the character's sheet shows
**400 + 25 pts** on the nameplate.

### New: edit what you built

An authored character stays editable — open it and hit **Edit**. Same as a generated
one, and for the same reason: it's the app's character, not a file you own. An imported
`.hdc` is still read-only and always will be.

### Fixed

- **Frameworks keep their slots.** A Multipower, Elemental Control or Variable Power Pool
  used to render as an **empty container with its powers sitting loose beside it**. They
  now nest inside it, indented, where they belong.

  **This affects characters you already have** — 27 of our 37 test characters had it, so
  if yours has a framework, its sheet will look different. **No cost changes**: the
  points were always calculated correctly, it was only ever the arrangement that was
  wrong. If a *cost* moves on a framework, that IS a regression — tell us.

  The bug was inherited from the old app and had been there the whole life of the
  rebuild. It never showed up in testing because nothing we compared against cared about
  arrangement.
- **An authored character shows its points and campaign type** on the nameplate, like a
  generated or imported one does.

## What to hammer on

1. **Open a character with a Multipower first.** Before anything else. Check its slots
   are inside it, and check the costs are exactly what they were in 2.7.1. That's the one
   change that touches what you already had.
2. **Build a character you'd actually play**, then build the same character in HERO
   Designer and compare the totals. Ours should match. Where it doesn't, that's the most
   valuable bug you can file — and please say which power, because the interesting ones
   will be about advantages and limitations.
3. **Try to make it lie.** Take a power with an advantage and a limitation, put it in a
   Multipower, and check the slot's cost. Take a Resistant Protection and check it
   actually raises your PD/ED. Take a skill at familiarity and check it's 1 point and 8-.
4. **Save, leave, come back, edit.** An authored character should re-open exactly as you
   left it and rebuild identically. If anything drifts, we want to know.
5. **Upgrade, don't reinstall.** Schema moves 7 → 8. Your characters should all still be
   there, and any generated ones still editable.
6. **Go over budget on purpose** and check the sheet reads "base + earned".

## Known gaps

- **Some traits aren't offered yet.** Weapon Familiarity, Transport Familiarity, Autofire
  Skills, Defense Maneuver, Rapid Attack, Two-Weapon Fighting, Cramming, Barrier,
  Duplication, Endurance Reserve, Flash, and the "custom" entries. The **Add** field tells
  you how many are missing from each list. They need forms of their own — offering a
  half-working one would let you build a character that quietly costs the wrong number,
  which is worse than not offering it.
- **Multipower slots are fixed slots.** Variable slots aren't offered, because the engine
  currently prices them identically to fixed ones and we'd rather not ship a choice that
  does nothing.
- **Equipment doesn't add to your defences.** A Resistant Protection bought as equipment
  costs its points and shows on the sheet, but doesn't raise PD/ED — the engine has never
  counted equipment toward totals. The app warns you when you build one. Whether it
  *should* count is a rules question we haven't settled.
- **There's no export.** An authored character lives on your device and can't be shared or
  backed up yet — and uninstalling loses it. Worth knowing before you spend an evening on
  one.
- **You can't reorder** the traits in a list; they stay in the order you added them.
- Cost Cruncher still isn't built.
