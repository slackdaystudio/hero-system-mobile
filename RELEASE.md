<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0
-->

# Releasing to testing (Android internal testing)

This is a **store cutover**: the rebuild ships under the same `applicationId`
(`com.herogmtools`) as the legacy app, so it replaces it on the existing Play
listing. Two consequences:

- The release build **must be signed with the legacy app's existing upload key**.
  A brand-new keystore will be **rejected** by Play ("upload key mismatch").
- `versionCode` must exceed what's live. Legacy shipped **62 / 2.3.0**; the last build
  out is **69 / 2.8.0**, and this repo is set to **70 / 2.9.0**
  (`android/app/build.gradle`, which carries the full version history in a comment).
  Bump `versionCode` for every subsequent upload.

**The iOS version does not come from the project file.** `build-signed.sh <marketing> <build>`
on the Mac passes `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION` **and**
`TARGETED_DEVICE_FAMILY="1,2"` straight to `xcodebuild`, which overrides whatever
`project.pbxproj` says. That is why the project file sat at the React Native default of
`1.0 (1)` while 2.7.x and 2.8.0 all shipped to TestFlight correctly versioned — the file
was simply never consulted.

The pbxproj values are now kept in step with Android anyway, so opening the project in
Xcode shows something truthful, but **the build script is the source of truth** and the
version you type on its command line is the version that ships. Don't "fix" a release by
editing the project file.

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

Gradle does **not** expand `~`, so `STORE_FILE` is either an absolute path or one
relative to **`android/app/`** — `storeFile file(...)` resolves against the module
directory, not the repo root. The build machine currently uses the relative form
(`hero-mobile.keystore`, i.e. `android/app/hero-mobile.keystore`), which works; checking
for it from the repo root does not, and looks alarming.

When those properties are present, `release` builds sign with them. **When they are
absent, release silently falls back to debug signing** — the build succeeds, the `.aab`
looks fine, and Play rejects it. That is the failure worth guarding against, which is
what the verification below is for.

## Build the bundle

```sh
npm ci
cd android
./gradlew bundleRelease        # -> app/build/outputs/bundle/release/app-release.aab
```

**If you `clean` first, delete `android/app/.cxx` too.** `./gradlew clean` removes the
generated codegen under `build/` but leaves the CMake/ninja cache in `.cxx`, which still
references it — the next configure then dies with:

```
CMake Error ... target_link_libraries):
  Cannot specify link libraries for target "react_codegen_OPSQLiteSpec"
  which is not built by this project.
ninja: error: rebuilding 'build.ninja': subcommand failed
```

It reads like a broken dependency and isn't; the two caches have just gone out of step.

```sh
rm -rf android/app/.cxx android/app/build
cd android && ./gradlew bundleRelease
```

A plain `bundleRelease` with no `clean` doesn't hit this. A full rebuild is ~2-3 minutes.

Confirm it's signed with the right key — not just *a* key:

```sh
AAB=app/build/outputs/bundle/release/app-release.aab
jarsigner -verify "$AAB"                                    # -> "jar verified."
jarsigner -verify -verbose -certs "$AAB" | grep -c "Android Debug"   # -> 0
unzip -p "$AAB" 'META-INF/*.RSA' | keytool -printcert | grep -E 'Owner|SHA1:'
```

The last one must print the legacy upload key:

```
Owner: CN=diceless.org, OU=Unknown, O=Diceless, L=Kitchener, ST=Ontario, C=CA
SHA1: 65:25:E8:AD:77:E2:17:E4:13:24:DA:5F:BD:43:8A:95:23:A2:CA:3C
```

That fingerprint is what Play matches. `jar verified` alone does **not** distinguish the
real key from the debug fallback — a debug-signed bundle also verifies.

The version that went in is easiest to read off the merged manifest (the `.aab`'s own
manifest is protobuf, and `versionName` is a compiled resource, so grepping it finds
nothing — which is normal, not a problem):

```sh
grep -oE 'android:version(Code|Name)="[^"]+"' \
  app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml
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

### 2.7.1 — Accessibility fix for modal dialogs; no schema change, no cost changes

Improves **accessibility support**: the Generate, Status Effect, and roll-result dialogs are
now readable by screen readers (**VoiceOver** on iOS, **TalkBack** on Android). Each dialog's
backdrop was itself an accessibility element, which on iOS collapsed the whole dialog into one
opaque item — title, controls, and buttons all unreachable. The backdrops are now transparent to
the accessibility tree (`accessible={false}`), so the contents are individually focusable; touch
behaviour (tap-outside-to-dismiss) is unchanged.

- **No schema change** (stays at 7) and **no cost changes** — this is an accessibility-tree /
  rendering fix only; the engine is untouched. A cost that moves is a regression.
- Nothing to migrate; safe to upgrade straight over 2.7.0.
- Surfaced by the new cross-platform UI test suite, which now also regression-guards it.

**Play "What's new" note:** *Accessibility: dialogs (random generator, status effects, roll
results) can now be read and operated with a screen reader. No changes to character costs.*

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
