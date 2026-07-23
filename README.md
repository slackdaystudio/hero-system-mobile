# HERO System Mobile

**A free, ad-free, privacy-respecting companion app for the [HERO System](https://www.herogames.com/) family of tabletop RPGs.** Load your characters, run the numbers, and roll the dice — on the phone already in your pocket.

Available since 2018 on:

[![App Store](https://img.shields.io/badge/App_Store-HERO_System_Mobile-0D96F6?logo=apple&logoColor=white)](https://apps.apple.com/us/app/hero-system-mobile/id1352750917)
[![Google Play](https://img.shields.io/badge/Google_Play-HERO_System_Mobile-414141?logo=googleplay&logoColor=white)](https://play.google.com/store/apps/details?id=com.herogmtools)
[![Amazon Appstore](https://img.shields.io/badge/Amazon_Appstore-HERO_System_Mobile-FF9900?logo=amazon&logoColor=white)](https://www.amazon.ca/Phil-Guinchard-HERO-System-Mobile/dp/B07BJ9879M)

[![Mobile UI (E2E)](https://github.com/slackdaystudio/hero-system-mobile/actions/workflows/mobile-ui.yml/badge.svg?branch=rebuild)](https://github.com/slackdaystudio/hero-system-mobile/actions/workflows/mobile-ui.yml)

Free means free: no ads, no tracking, no upsells — and it will stay that way.

---

## What it does

HERO System Mobile takes the bookkeeping off the table so you can keep playing:

- **📄 Import your characters** — open [HERO Designer](https://www.herogames.com/) `.hdc` files and read them on any device.
- **🧮 Full character sheets** — characteristics, powers, skills, and combat values, priced by a faithful port of the HERO rules engine.
- **🎲 Purpose-built dice roller** — skill checks, hit locations, damage (Normal/Killing), and effect rolls, with BODY/STUN/knockback worked out for you.
- **🔋 Endurance tracking** — spend and recover END during combat, for both editions.
- **✨ Random character generation** — deal a hand of archetypes and keep the one you like; every generated character is priced by the same engine that reads a real `.hdc`.

### Both editions, first-class

The rules engine supports **5th Edition** and **6th Edition** side by side — figured characteristics, edition-specific costs, and all — so tables on either ruleset are covered.

---

## About this rebuild

This repository is a **clean-room rebuild** of HERO System Mobile on a modern stack: **React Native 0.79 + TypeScript**. The goal was a codebase that's a pleasure to maintain and a rules engine you can trust.

Two ideas drive the design:

### A rules engine proven against real characters

The HERO ruleset is deep, and small pricing mistakes are easy to make and hard to spot. So the engine is **golden-mastered against 37 real (sanitized) characters** — every characteristic total, power cost, and combat value is pinned by tests. When the rules and the code disagree, the tests are how we find out. Several long-standing costing bugs were caught and corrected this way.

### A strict, enforced architecture

The code is split into three layers with a one-way dependency rule:

```
app  →  infra  →  core/ports  ←  core
```

- **`src/core/`** — the pure TypeScript domain: dice, templates, the character model, traits, and combat. **No React, no React Native, no platform code.** Everything it needs from the outside world it reaches through interfaces in `core/ports`.
- **`src/infra/`** — the native adapters that implement those ports (RNG, persistence, file access, import, migration).
- **`src/app/`** — the UI: screens, components, navigation, and theme.

The boundary isn't a convention you have to remember — an ESLint rule fails the build if anything in `core/` reaches for a platform import. The payoff: the entire rules engine runs and is tested in plain Node, fast and deterministic.

---

## Getting started

### Prerequisites

Follow the React Native [environment setup](https://reactnative.dev/docs/set-up-your-environment) for your platform (Node, plus Xcode for iOS and/or Android Studio for Android).

### Install

```sh
npm install

# iOS only — install CocoaPods dependencies (first clone, and after native dep changes)
bundle install
bundle exec pod install
```

### Run

```sh
npm start            # start the Metro dev server (add --reset-cache to clear it)
npm run android      # build & launch on Android
npm run ios          # build & launch on iOS
```

### Check your work

```sh
npm run lint         # ESLint, including the pure-core boundary guard
npx tsc --noEmit     # TypeScript type-check
npm test             # Jest — two projects: `core` (pure Node) and `app` (RN preset)

# run a slice
npx jest --selectProjects core
npx jest src/core/dice
```

Lint, type-check, and tests should all be green before you send a change.

### Cross-platform UI tests

The Jest suites run in Node, so they prove the rules are right but can't see how a screen
actually renders. Because React Native lays out through each platform's own stack, the same
component can come out subtly different on iOS and Android. To catch that, the **same
[Maestro](https://maestro.dev/) flows** ([`.maestro/`](.maestro)) drive a real iOS Simulator
and a real Android emulator in CI, screenshotting every meaningful screen on each. Both builds
are standalone (JS bundled in), so there's no Metro server to race and no signing secrets.

```sh
npm run e2e:ios       # against a booted simulator with the app installed
npm run e2e:android   # against a booted emulator with the app installed
```

The character sheet can go one step further: an **on-demand visual-regression gate**. A flow
opens a fixed, engine-priced character and screenshots its sheet; when requested, CI pixel-diffs
that against a committed per-platform baseline — the same idea as the golden masters, one layer
up (they pin the *numbers*, this pins the *render*). It's opt-in rather than always-on because
on-device screenshots are still fiddly to keep stable; see the docs for the trade-offs.

See [`docs/UI_TESTING.md`](docs/UI_TESTING.md) for the flows, how determinism is achieved, and
how to update a baseline when a sheet change is intended.

---

## Project layout

```
src/
  core/     pure domain — dice, templates, hero model, traits, combat, random
    ports/  interfaces the platform must implement (RNG, persistence, files, …)
    data/   the HERO Designer rules data
  infra/    native adapters implementing core/ports
  app/      UI — screens, components, navigation, theme
fixtures/   real, sanitized characters used by the golden-master tests
docs/       architecture and design notes
```

Path aliases `core/*`, `infra/*`, and `app/*` resolve in both the build and the tests.

---

## Contributing

This started as one developer's labour of love and is open to yours. Bug reports, feature ideas, and pull requests are all welcome:

- **Found a wrong number?** That's the most valuable bug there is. Open an issue with the character (or a minimal repro) and what HERO Designer says it should be.
- **Have a feature idea but not the code?** Open an issue and describe it.
- **Sending a PR?** Keep `core/` platform-free, add or update tests, and make sure `lint` / `tsc` / `test` are green.

See [`REBUILD_PLAN.md`](REBUILD_PLAN.md) and the [`docs/`](docs) folder for architecture and design context.

---

## License & attribution

Created and maintained by **Phil Guinchard** ([@sentry0](https://github.com/sentry0)) under [Slack Day Studio](https://github.com/slackdaystudio). Free and ad-free since 2018.

Licensed under the **[Apache License 2.0](LICENSE)** — © 2026 Phil Guinchard. You're free to use, modify, and distribute the code under its terms.

> **Not affiliated with Hero Games.** *HERO System®*, *Champions®*, and related marks are trademarks of their respective owners. This is an independent, fan-made tool — built by players, for players — and is not published, endorsed, or sponsored by the rights holders. You'll need the official HERO System rulebooks to play, and [HERO Designer](https://www.herogames.com/) to author the character files this app reads.
