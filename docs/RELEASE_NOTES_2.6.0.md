<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Draft notes for the 2.6.0 internal-testing release. Paste into Play Console →
Internal testing → release notes (the short version), and send the long version
to testers however you normally reach them.

Assumes testers are coming from 2.5.0, which rolled out. If anyone is jumping
straight from 2.4.1, point them at RELEASE_NOTES_2.5.0.md — the cost changes are
the headline there, and this build doesn't repeat them.
-->

# 2.6.0 — release notes (draft)

## Short version (Play Console, ~500 char limit)

```
6th Edition random characters! Characters → Generate now asks which edition and
rolls a full, legal 400-point 6E hero — or the 250-point 5E one you already had.
Same engine, so if it says 400 it really spends 400.

Also: frame your portraits. Drag and pinch to choose which part of the picture the
square shows, instead of always getting the middle.

No character costs change in this build.
```

## For testers

**Nothing about your existing characters changes in this build.** 2.5.0 was the one
that moved costs; the engine is untouched here. If a number moves in 2.6.0, that is a
real regression and we want to hear about it — the opposite of last build.

### New: 6th Edition random characters

Characters → **Generate** is now a proper dialog. Pick an edition at the top, watch it
roll, and read what you got:

> **You are an Ice Powered Armor Socialite**
> Hardsuit · 400 of 400 points

- **5E** rolls the 250-point Low Powered hero you already had.
- **6E** rolls a **400-point Standard hero** — new, and the other half of the original
  idea. Eleven archetypes, eleven professions, all authored from scratch.
- Don't like it? **Roll Again**. Nothing is saved until you tap **View**, so you can
  roll all day and only keep the one you want.

The edition pills start on whichever edition you've set in Settings, since you've
already answered that question once.

**Why 6E is a bigger deal than "the same thing with different numbers."** 6E figures
nothing: in 5E your PD, ED, SPD, REC, END and STUN fall out of STR/CON/DEX for free,
and your OCV/DCV come off DEX. In 6E every one of those is bought. So a 6E character
isn't a 5E one scaled up — it's a different shape, and all eleven archetypes had to be
built from nothing.

They're balanced against a **Rule of X** model and benchmarked against real 400-point
characters, so a generated 6E hero should sit in the same league as one a GM would
hand you. Every roll lands within 10% of the campaign norm.

Two deliberate choices you'll notice, and they're not oversights:

- **No Variable Power Pools.** Multipowers instead — friendlier to a new player, and a
  VPP tends to end the interesting part of building a character.
- **No Combat Skill Levels at creation.** Those points go into base OCV/DCV instead. A
  CSL is a thing you have to remember to apply; an OCV is just your OCV.

### New: portrait framing

Portraits were always centre-cropped, which is fine for a head-and-shoulders shot and
wrong for everything else. On import you can now **drag** to choose which part of the
picture the square shows, and **pinch** (or use the +/− buttons) to zoom.

Existing portraits are untouched and still show the centre — reframe them if you like.

### Fixed

- **Editing a 6E character stays in 6E.** Re-rolling a 6E character's archetype could
  draw a 5E powerset, which would either fail to save or quietly stop the character
  being editable. Only reachable now that 6E characters exist, but it's fixed.
- The random character reveal says **"an Ice Brick"**, not "a Ice Brick", and calls a
  Playboy/Socialite a **Socialite**. Small, but you'd have seen it every roll.
- **Eldrich → Eldritch.** A typo that's been in the special-effects list since the old
  app. Characters already named "Eldrich Something" keep their name.

## What to hammer on

1. **Roll a pile of 6E characters and look at them like a GM.** These spreads are
   authored, not lifted from anything — there's no legacy 6E data to have copied. If
   one looks overpowered, underpowered, or just silly, that's the single most valuable
   thing you can tell us. You are the oracle here, not a fixture file.
2. **Edit a 6E character.** Re-roll its archetype, retrain its profession, name its
   languages. Confirm it stays a 400-point 6E character and doesn't drift.
3. **Upgrade, don't reinstall.** The schema moves 5 → 7 (portrait framing). Your
   characters should all still be there.
4. **Frame a few portraits**, including a wide one and a tall one, and check the crop
   survives a restart.

## Known gaps

- Random characters cover **5E Low Powered (250)** and **6E Standard (400)**. 5E
  Standard (350) and 6E Low-Powered (300) aren't authored.
- The 5E archetypes have never been graded against the Rule of X — they're lifted from
  the old app's prose, and the nearest model campaign is 225, not 250. They're legal
  and on-budget; whether they're balanced *against each other* is unmeasured.
- Cost Cruncher isn't built yet.
