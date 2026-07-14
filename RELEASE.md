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
  is set to **63 / 2.4.0** (`android/app/build.gradle`). Bump `versionCode` for
  every subsequent upload.

## One-time signing setup

1. Put the **legacy upload keystore** at `android/app/herogmtools-upload.keystore`
   (or anywhere — the path in `keystore.properties` is resolved relative to
   `android/app/`). Both the keystore and `keystore.properties` are gitignored.
2. Copy the template and fill it in:
   ```sh
   cp keystore.properties.example keystore.properties
   # edit keystore.properties: storeFile, storePassword, keyAlias, keyPassword
   ```
   With `keystore.properties` present, `release` builds sign with it; without it,
   they fall back to debug signing (fine for a local smoke test, rejected by Play).

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
- [ ] `keystore.properties` points at the **legacy** upload key
- [ ] `versionCode` is higher than the last uploaded build
- [ ] AAB verifies against the expected certificate
- [ ] Smoke-tested on a device (see the QA checklist you ran)
