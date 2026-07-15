<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Draft notes for the 2.5.0 internal-testing release. Paste into Play Console →
Internal testing → release notes (the short version), and send the long version
to testers however you normally reach them.
-->

# 2.5.0 — release notes (draft)

## Short version (Play Console, ~500 char limit)

```
Random characters! Roll a full, legal 250-point 5E hero — characteristics, powers,
skills and complications — then edit it: rename it, re-roll its archetype, retrain
its profession, name its languages and sciences.

Also: delete a character (with a confirmation), a trash button on each row, and the
Home "Recent" list now updates as you use it.

Under the hood: ten fixes to the rules engine, inherited from the old app. Some of
your characters' costs will change. That's the point — see below.
```

## For testers

**Your character costs may change, and that is the headline.**

The engine was ported from the old app faithfully — bugs included, on purpose, so we
could prove the port matched before fixing anything. This build is the first to fix
them. Ten real bugs, some of them a decade old:

- Unusual defenses (Mental/Power/Flash Defense) ignored the same visibility rules
  every other trait obeys. **This one touches about a third of characters.**
- Enhanced Perception was priced wrong — an "all senses" buy cost a third of what it
  should.
- Clinging quietly charged one point too many.
- Powers inside a Variable Power Pool counted toward your totals even though nothing
  was allocated to them.
- Duplicate powers were skipped in characteristic and defense totals.
- A maneuver with an unresolved template rendered as a blank row costing 0, with no
  error — for the whole life of the port.

So: **if a character's total moved, that is expected.** Before reporting it, check the
number against HERO Designer. If we disagree with HD, that's a bug and we want it. If
we now agree with HD where we didn't before, that's the fix landing.

**New: random characters.** Characters → Generate. You get a complete, legal 5E Low
Powered hero at the full 250 — not a sketch. Every point is priced by the same engine
that reads your `.hdc` files, so if it says 250 it really spends 250.

Generated characters can be edited (imported ones can't — those are your files, and
the app leaves them alone):

- **Name** — type over it; your name sticks through a re-roll.
- **Archetype** — re-rolls powers and characteristics, keeps skills and complications.
- **Profession** — re-rolls skills, keeps powers and characteristics.
- **Special FX** — renames the character if you haven't named it yourself.
- **Languages and Science Skills** — the old templates said "Lang:" and "SS:" and
  never said which, so you name them. They follow you across a re-roll.

**New: delete a character.** Trash button on each row, or long-press. It confirms
first — deleting drops the character *and* its portrait, and for an imported
character the `.hdc` may be your only copy.

**Fixed:** the Home "Recent" list showed whatever order it had at app launch, all
session. Opening a character now moves it to the front, and deleting one removes it.

**Fixed:** the Alternate Identity slider now appears only on characters that actually
have an "Only In Alternate Identity" trait.

## What to hammer on

1. **Import your trickiest builds** — VPPs, multipowers, frameworks, martial arts —
   and compare totals against HERO Designer. That comparison is the most valuable
   thing a tester can do this build.
2. **Upgrade, don't reinstall.** This build changes the database schema for the first
   time since 2.4.1. If your characters survive the update, that's the thing we most
   need to know worked.
3. Roll a dozen random characters and see if any of them look illegal or silly.

## Known gaps

- Random characters are **5E Low Powered (250)** only. 6E at 400 is next.
- The random generator covers 11 archetypes and 11 professions.
- Cost Cruncher isn't built yet.
