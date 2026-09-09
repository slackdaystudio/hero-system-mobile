<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Public store copy for promoting 2.9.0 out of testing and into **production**.

This is the *other* audience. `RELEASE_NOTES_2.9.0.md` is written for testers coming
from 2.8.0 — it asks them to hammer on things and lists what is still missing.
Everything here is written for a stranger whose phone just offered them an update.

**The span is not 2.8.0 → 2.9.0.** Production is on **legacy 2.1.13**. These people have
never seen the rebuild, never saw 2.5.0's cost corrections, and never saw 2.2.0/2.3.0
either — those were beta-only on the legacy app. So the notes below describe the whole
distance, not this release.

Two things to decide before you paste anything:

1. **Staged rollout.** A month of silence from internal testing is not evidence the
   migration works at scale; it is evidence that nobody exercised it. The one code path
   with real risk here runs exactly once per device, on first launch, over data you have
   never seen (`migrateV1`: legacy `.hsmc` files on disk are authoritative, AsyncStorage
   supplies the slot/active pointers). Start at 10–20% and watch the Play vitals for
   ANRs/crashes in the first-launch window before going wide.
2. **The listing itself still sells the legacy app.** The description and screenshots
   predate every screen in this build. "What's new" is read once; the listing is read by
   everyone who has not installed yet. Worth its own pass — not drafted here.

Field limits: Play "What's new" is **500 characters** per language. App Store
"What's New in This Version" is **4000**. Both render as plain text — no markdown.

One judgement call left open, deliberately: the notes say Cost Cruncher "hasn't been
rebuilt yet" and that dice sounds are gone, and they **promise neither back**. Cost
Cruncher is genuinely on the roadmap; sound was dropped on purpose (`fbccfc7`), so
"coming back" would be a promise the repo does not support. If you want to promise
either, say so and I will reword — but don't promise sound by accident.
-->

# 2.9.0 — public release notes (production promotion)

## Play Console — "What's new" (≤500 characters)

Paste at the promote step. Play carries the internal-testing notes forward by
default, and those are tester notes — replace them.

```
HERO System Mobile has been rebuilt from the ground up.

Your saved characters, settings and dice statistics carry over automatically the first time you open it.

New: build a complete character in the app, priced by the same engine that reads HERO Designer files. Roll up a random one. Track Endurance, Body and Stun through a fight.

Point totals may read differently than before — a batch of long-standing pricing bugs are fixed, so sheets now agree with HERO Designer.
```

## App Store Connect — "What's New in This Version" (≤4000 characters)

```
HERO System Mobile has been rebuilt from the ground up — new rules engine, new storage, new interface.

YOUR CHARACTERS COME ACROSS
The first time you open this version it migrates what the old app had saved: your characters, your settings and your dice statistics. There is nothing to export and nothing to re-import.

BUILD A CHARACTER IN THE APP
Characteristics, skills, perks, talents, powers with their advantages and limitations, martial arts, Multipowers and complications — all of them, in both 5th and 6th edition. The app prices as you type, using the same engine that reads a HERO Designer .hdc file, so the total it shows you is the total HERO Designer would show. Set your campaign's allowance and anything past it counts as earned experience.

ROLL UP A CHARACTER
Deal a hand of five and keep the one you like. 5th Edition Low Powered (250 points) and 6th Edition Standard (400). A generated character can be edited and rebuilt afterwards.

TRACK A FIGHT
Endurance, Body, Stun and status effects, on a character sheet laid out like the printed one.

POINT TOTALS MAY HAVE CHANGED
A batch of long-standing pricing bugs are fixed in this version: unusual defenses, Enhanced Perception, Clinging, duplicate powers, Variable Power Pools, and framework slots that were being listed outside their framework. Characters you already have may read a different total than they did before. In each case the new number is the one HERO Designer agrees with — if you find one that doesn't, we want to hear about it.

ALSO NEW
- Frame your character's portrait
- Quick Pick: nine characters on a grid on Home, and behind a handle on the sheet
- Screen reader support for the dialogs (VoiceOver)
- One dice screen instead of five

NOT IN THIS VERSION
Cost Cruncher hasn't been rebuilt yet, and dice sound effects are gone.
```

Android wants the same text with **TalkBack** in place of VoiceOver. That is the
only difference between the two.

## App Review notes (App Store Connect → App Review Information)

Not release notes — this is the field that stops a reviewer bouncing the build for
"we could not evaluate the app". Worth filling in given the app is an offline utility
for a game they've never heard of.

```
HERO System Mobile is an offline utility for players of the HERO System tabletop
role-playing game (Champions, Fantasy Hero). It is a dice roller, a character sheet
reader and a character builder.

- No account, no login, no sign-up. Every feature is available on first launch.
- No network access is needed; no feature calls a server.
- Nothing is shared between users. All data stays on the device.
- Importing a character reads a HERO Designer .hdc file the user already has, chosen
  through the system file picker.

You do not need a sample file to review the app: on the Characters screen, tap
"Generate" in the header and the app builds a complete, fully-priced character on its
own. That exercises every screen — sheet, combat tracker, dice, statistics.

This is a full rewrite of an app already on the store under the same bundle id
(org.diceless.herogmtools). It migrates data saved by the previous version on first
launch.
```

## What a 2.1.13 user loses

Named here so nobody is surprised by a one-star review that turns out to be correct.
Only the first two are in the notes above; the other two are shape changes people will
work out in a minute.

- **Cost Cruncher is gone** — legacy had `CostCruncherScreen`, the rebuild hasn't got
  there yet. It is the last screen outstanding.
- **Dice sounds are gone** — legacy's `playSounds` / `onlyDiceSounds` settings drove
  `SoundPlayer`. Dropped in `fbccfc7`. Mitigating: legacy defaulted `playSounds` to 0,
  so most users never heard them.
- **Character slots / loadouts are gone** — replaced by the library plus an active
  character (migration 003). Quick Pick is what fills the "my five characters" hole.
- **Five dice screens are now one** — Skill, Hit, Damage, Effect and Result collapsed
  into `DiceScreen`.

## Before you promote

- [ ] Replace the carried-over internal-testing notes with the Play copy above
- [ ] Staged rollout, not 100% (see the header — first-launch migration is the risk)
- [ ] Upgrade over a **legacy 2.1.13** install on a real device and confirm characters,
      settings and statistics all arrive. Upgrading over 2.8.0 tests nothing that
      matters here — `migrateV1` won't run at all.
- [ ] iOS: this assumes the App Store is also on 2.1.13. If iOS is TestFlight-only and
      has never shipped publicly, the "your characters come across" paragraph is wrong
      for those users and should come out.

## Store listing description (Play "full description" / App Store "description")

Rewritten from the live 2.1.13 listing, keeping its shape and voice. Plain text —
no markdown. Under 4000 characters on both stores.

```
Bring your HERO System characters with you and play them on your phone. Import the ones
you already have, build new ones from scratch, or roll one up — then run them at the
table with the dice tools built in.

Some key features:

* import 5th and 6th edition characters from HERO Designer files directly
* build a character in the app — characteristics, skills, perks, talents, powers with
  their advantages and limitations, martial arts, Multipowers and complications, in
  either edition, and priced as you type by the same engine that reads a HERO Designer
  file
* tap any roll on the character sheet to open the dice roller with it already filled in,
  or hold it to roll on the spot
* use the dice rolling tools to play the game — skill checks, to-hit rolls, damage and
  effect rolls, all on one screen
* track Endurance, Body and Stun through a fight, along with the status effects riding
  on your character
* the app locally tracks cumulative statistics about your die rolls that you can review
* randomly generate a complete character — 5th edition on 250 points or 6th edition on
  400. It deals you a hand of five and you keep the one you like
* frame your character's portrait, and keep the ones you play most on a quick-pick grid
* everything stays on your device: no account, no sign-up, and it all works with no
  signal
```

### What changed from the live listing, and why

- **"shake the phone on die-rolling screens to make a roll" — removed, and it was
  already untrue.** `react-native-shake` came out in `3691508` (March 2023); no tag from
  `v2.1.3` onward contains it, so the live 2.1.13 build has no shake handler. The listing
  has been advertising a feature the shipped app doesn't have for years. Nobody loses
  anything by its removal — the line was the bug.
- **The H.E.R.O. tool lost its name and gained an edition.** It's both editions now (5E
  on 250, 6E on 400) and it deals a hand of five, so the old one-line claim was wrong on
  two counts. I also dropped the "H.E.R.O." acronym because no screen in the rebuild uses
  it — the button says **Generate**. If that name has currency with your players, say so
  and I'll put it back as a parenthetical.
- **"roll characteristic or skill checks from the character sheet" got more specific.**
  The rebuild does tap-to-prefill and long-press-to-roll-inline
  (`CharacterDetailScreen.tsx:53`), which is a better line than the old generic one.
- **Character building is new to the listing entirely.** It's the headline of the last
  two releases and the old description couldn't mention it. It goes second, right after
  import, because import is still how most people arrive.
- **Added Endurance/Body/Stun tracking**, and an explicit **offline, no account** line —
  worth stating outright for a paid-adjacent tabletop utility, and it matches what the
  App Review notes claim.
- **Not mentioned: Cost Cruncher.** It's in neither the old description nor this one, so
  nothing needs saying — but don't re-add it from an older draft, it isn't built.

## Forum post — the cutover announcement (HERO Games forums)

This is **not** the per-release post template in `RELEASE_NOTES_2.9.0.md`. That one is
written for the tester thread and spans 2.8.0 → 2.9.0. This one is public and spans
**2.1.13 → 2.9.0** — the whole rebuild, arriving at once, for people who have never seen
any of it. Post it as a new thread rather than a reply in the release thread.

The forums take Markdown, so `#` headings and the usual emphasis work.

Two things it deliberately does: it leads with the migration (that is the only question a
returning user actually has), and it puts the changed point totals in their own section
under a heading that says what they are. Burying that is how you earn a one-star review
from someone who is *correct* that the number moved.

---

# HERO System Mobile has been rebuilt from the ground up

If you have this app installed, the update that just landed is not a normal update. The
version on the store had been sitting at 2.1.13 since January. 2.9.0 replaces essentially
all of it — new rules engine, new storage, new interface — so everything below arrives at
once rather than in the dribs and drabs it was actually built in.

**Your characters come across.** The first time you open it, it migrates what the old app
had saved: your characters, your settings, your dice statistics. There is nothing to
export and nothing to re-import. If something doesn't make the trip, that's a bug and I
want to hear about it — please say so before you reinstall, because reinstalling destroys
the evidence.

## You can build a character in the app now

This is the big one. Characters → **New**.

Characteristics, skills, perks, talents, powers with their advantages and limitations,
martial arts, Multipowers and Elemental Controls and VPPs, complications — all of it, in
both 5th and 6th edition. It prices as you type, using **the same engine that reads a HERO
Designer `.hdc` file**. That's the part I care about: the total it shows you is the total
HERO Designer shows you, because it is not a second implementation of the rules that has
to be kept in sync with the first one.

Set your campaign's point allowance and anything past it counts as earned experience —
5E quotes base points with disadvantages adding to them, 6E quotes total points with
complications granting nothing, and the labels say which so you're never guessing which
convention you're looking at.

## You can roll one up

Characters → **Generate** deals you a **hand of five** complete, legal characters and you
keep the one you like. 5th Edition Low Powered on 250 points, or 6th Edition Standard on
400. Nothing is saved until you pick one — the four you didn't take never existed.

They're built, not sketched. Every point is priced by the same engine, so if it says 400
it really spends 400, and a generated character can be edited and rebuilt afterwards —
rename it, re-roll its archetype, retrain its profession.

The 6E archetypes are authored from scratch, because there was no 6E prose to lift. They
were graded against a Rule of X model and benchmarked against real 400-point characters,
so a rolled 6E hero should sit in the same league as one a GM would hand you.

## You can run a fight

Endurance, Body, Stun and status effects, tracked on a character sheet laid out like the
printed one. Tap a power's END to spend it; the pool burns STUN when it runs dry. Tap any
roll on the sheet to open the dice roller with it filled in, or hold it to roll on the
spot. Your Strength shows its damage dice and rolls like anything else.

Also: one dice screen instead of five, portraits you can drag and pinch to frame instead
of always getting the centre crop, and a nine-character quick-pick grid on Home and behind
a handle on the sheet — long-press a slot to pin someone there.

## Your point totals may read differently, and that's the point

**Read this bit before you file a bug.**

The old engine had real bugs in it, some of them a decade old. The rebuild reproduced them
deliberately and exactly first — that's how I could prove the port was faithful before
changing anything — and then fixed them one at a time. Fourteen of them. You get all
fourteen at once, and roughly a third of real characters read differently than they did.

The ones most likely to move your sheet:

- **Unusual defenses** (Mental, Power and Flash Defense) ignored the visibility rules every
  other trait obeys. This one touches about a third of characters on its own.
- **Enhanced Perception** was priced wrong — an "all senses" buy cost a third of what it should.
- **Clinging** quietly charged a point too many.
- **Duplicate powers** were skipped in characteristic and defense totals.
- **Powers inside a VPP** counted toward your totals even with nothing allocated to them.
- **Framework slots rendered outside their framework** — a Multipower showed as an empty
  container with its powers loose beside it. Costs were always right there; only the
  arrangement was wrong, and it's fixed.

So if a total moved, the question isn't "did the app break" — it's "does it now agree with
HERO Designer". In every one of these cases the new number is the one HD agrees with. If
you find one where it *doesn't*, that's a real bug and it's the single most useful thing
you can report. Please say which power.

## What's gone

Being straight about this, because you'll notice:

- **Cost Cruncher hasn't been rebuilt yet.** It's the last screen outstanding and it is on
  the list.
- **Dice sound effects are gone.** Dropped on purpose. (The old app defaulted them to off,
  so most people never heard them.)
- **Character slots are gone**, replaced by a library plus one active character. The
  quick-pick grid is what fills that hole, and it holds nine instead of five.
- **The five dice screens are now one.**

There's also no export yet — a character you build in the app lives on your device.

## For anyone who cares how it's built

It's open source, Apache-2.0, and always has been:

**https://github.com/slackdaystudio/hero-system-mobile**

The short version: React Native 0.79 and TypeScript, with the rules engine as a pure
TypeScript layer that has no idea it's running on a phone — no React, no native imports,
enforced by a lint rule rather than good intentions. It's tested against a corpus of real
sanitized `.hdc` characters, which is what made the fourteen corrections above safe to
make: every fix had to show exactly which characters it moved, and why, before it landed.

Every one of those quirks is written up in `docs/KNOWN_DEVIATIONS.md` with what it did,
whether it was a real bug or just odd-looking, and which characters it affected. If you've
ever wondered why an app disagreed with your maths, that file is the honest answer for this
one. There's also a full changelog covering this whole 2.1.13 → 2.9.0 span in `docs/`.

Issues and pull requests are both welcome. So are bug reports that just say "this number is
wrong and here's the character" — that's genuinely the most valuable thing.

## Reporting things

The most useful bug report is: **what the app says, what HERO Designer says, and which
power**. If it's a character that came across from the old version, mentioning that helps
too, since the migration only runs once and I can't reproduce it after the fact.

Thanks to everyone who's been running the test builds — a good chunk of the fixes above
exist because somebody said "that doesn't look right".
