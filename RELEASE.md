<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0
-->

# Releasing to testing (Android internal testing)

This is a **store cutover**: the rebuild ships under the same `applicationId`
(`com.herogmtools`) as the legacy app, so it replaces it on the existing Play
listing. Two consequences:

- The release build **must be signed with the legacy app's existing upload key**.
  A brand-new keystore will be **rejected** by Play ("upload key mismatch").
- `versionCode` must exceed what's live. Legacy shipped **62 / 2.3.0**; this repo
  is set to **65 / 2.5.0** (`android/app/build.gradle`). Bump `versionCode` for
  every subsequent upload.

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

A fresh install exercises none of the risk. Two things only an **upgrade** can show,
and both are live for the first time in **2.5.0**:

**The schema moves 4 → 5.** Migration 005 adds `origin`/`recipe` and backfills edit
rights from the `generated-` id prefix. It's additive and covered against real SQLite
(including the backfill), but 2.5.0 is the first build to run it on a phone with real
data. Install the *previous* build, import a character or two, then install this one
over the top and confirm they're all still there.

**Costs change on characters people already have.** 2.5.0 carries ten engine
correctness fixes (H3–H10, U2, U3 — `docs/KNOWN_DEVIATIONS.md`). These are real
legacy bugs, faithfully ported and now fixed, so sheets that were wrong become right:

| Fix | What moves | Seen in the corpus |
|---|---|---|
| H8 | Unusual defenses now obey the visibility rule | **14 of 37 fixtures** |
| H9 | Enhanced Perception priced by what it enhances | adamantine 9 → 27, jane-fawn 2 → 6 |
| H10 | Clinging loses a stray +1 | mark-li, aoe, spyder2022 |
| H3/H5/H6/H7/U2 | Duplicate powers, VPP contents, defense totals | junkyard, defensor, adamantine, mark-li… |

Roughly a third of real characters will show a different number than they did in
2.4.1. **Say so in the release notes** — a tester who doesn't know will report the fix
as the bug.
