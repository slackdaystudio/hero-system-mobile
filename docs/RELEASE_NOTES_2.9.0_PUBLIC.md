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
