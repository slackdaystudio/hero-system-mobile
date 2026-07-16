<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0
-->

# Releasing to testing (Android internal testing)

This is a **store cutover**: the rebuild ships under the same `applicationId`
(`com.herogmtools`) as the legacy app, so it replaces it on the existing Play
listing. Two consequences:

- The release build **must be signed with the legacy app's existing upload key**.
  A brand-new keystore will be **rejected** by Play ("upload key mismatch").
- `versionCode` must exceed what's live. Legacy shipped **62 / 2.3.0**; **65 / 2.5.0**
  is out to internal testing, and this repo is set to **67 / 2.7.0**
  (`android/app/build.gradle`). Bump `versionCode` for every subsequent upload.

## Signing setup

Release signing reads the app's key from **`~/.gradle/gradle.properties`** (Gradle
loads it automatically — never committed) under the **`HEROGMTOOLS_RELEASE_`**
prefix. These must be the **legacy app's existing upload key** (cutover). Already
configured on the build machine:

```properties
HEROGMTOOLS_RELEASE_STORE_FILE=/absolute/path/to/herogmtools-upload.keystore
HEROGMTOOLS_RELEASE_STORE_PASSWORD=…
HEROGMTOOLS_RELEASE_KEY_ALIAS=…
HEROGMTOOLS_RELEASE_KEY_PASSWORD=…
```

Use an **absolute** `STORE_FILE` path (Gradle does not expand `~`). When those
properties are present, `release` builds sign with them; absent, release falls
back to debug signing (fine for a local smoke test, rejected by Play).

## Build the bundle

```sh
npm ci
cd android
./gradlew bundleRelease        # -> app/build/outputs/bundle/release/app-release.aab
```

Confirm it's signed with the right key:
```sh
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab | head
```

## Upload to internal testing

Play Console → **HERO System Mobile** → Testing → **Internal testing** →
**Create new release** → upload the `.aab` → add release notes → roll out.
(App Signing by Google Play must be enabled on this listing, which it is for the
legacy app — that's why the upload key must match.)

Add testers under **Internal testing → Testers**, share the opt-in link, install
from Play.

## iOS (later, needs a Mac)

Bundle id is set to `org.diceless.herogmtools`. Building/uploading to TestFlight
requires Xcode + an Apple Developer account and can't be done from Linux. When on
a Mac: `cd ios && pod install`, set the signing team in Xcode, Archive → upload to
App Store Connect → TestFlight.

## Pre-push checklist

- [ ] `npm run lint && npx tsc --noEmit && npm test` all green
- [ ] `HEROGMTOOLS_RELEASE_*` in `~/.gradle/gradle.properties` points at the **legacy** upload key
- [ ] `versionCode` is higher than the last uploaded build
- [ ] AAB verifies against the expected certificate
- [ ] Smoke-tested on a device (see the QA checklist you ran)
- [ ] **Upgraded over the live build**, not just installed fresh — see below

## Upgrading over a live install

A fresh install exercises none of the risk. Install the *previous* build, import a
character or two, then install this one over the top and confirm they're all still
there.

### 2.7.0 — Endurance tracking; no schema change, no cost changes

Adds **Endurance tracking** (6E and 5E) and the **character-type / points nameplate**.

- **No schema change.** END rides existing storage: the running pool is already a field on
  the combat-state blob, and the nameplate's declared points ride in the character-document
  JSON (`basicConfiguration`, preserved at import/generate). Schema stays at 7.
- **Changes no costs on existing characters.** It's all additive display/tracking — the
  engine's `realCost`/`activeCost` are untouched. As with 2.6.0, a cost that moves is a
  regression, not an expected fix.
- Existing imported characters show **no points/tier** until re-imported (their stored docs
  predate `basicConfiguration`); END tracking works for them regardless.

### 2.6.0 — the schema moves 5 → 7

Migrations 006 and 007 add `portrait_focus_x`/`_y` and `portrait_focus_scale`. Both
are additive, both are covered against real SQLite, and a character with no framing
reads as `null` — the centre crop every portrait got before framing existed. They are
two migrations rather than one line added to 006 because **006 had already run on a
dev device**, and a migration that has run is immutable.

2.6.0 **changes no costs on characters people already have.** 2.5.0 did that; this
build's engine is unchanged. A cost that moves in 2.6.0 is a real regression, not an
expected fix — worth knowing, because it inverts what a tester should report.

### 2.5.0 — shipped; kept for the reasoning

**The schema moved 4 → 5** (migration 005: `origin`/`recipe`, backfilling edit rights
from the `generated-` id prefix), and **costs changed on characters people already
had** — ten engine correctness fixes (H3–H10, U2, U3, `docs/KNOWN_DEVIATIONS.md`).
Real legacy bugs, faithfully ported and then fixed, so sheets that were wrong became
right:

| Fix | What moves | Seen in the corpus |
|---|---|---|
| H8 | Unusual defenses now obey the visibility rule | **14 of 37 fixtures** |
| H9 | Enhanced Perception priced by what it enhances | adamantine 9 → 27, jane-fawn 2 → 6 |
| H10 | Clinging loses a stray +1 | mark-li, aoe, spyder2022 |
| H3/H5/H6/H7/U2 | Duplicate powers, VPP contents, defense totals | junkyard, defensor, adamantine, mark-li… |

Roughly a third of real characters read differently than they did in 2.4.1. The lesson
worth keeping: **say so in the release notes** — a tester who doesn't know will report
the fix as the bug.
