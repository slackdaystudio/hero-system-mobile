# Cross-platform UI testing

React Native renders through each platform's own layout and text stack, so the same
component can come out *subtly* different on iOS and Android — a label wraps a line
earlier, a shadow changes a row's height, a font metric nudges alignment. This is the
tier of test that catches that: the **same flows driven on a real iOS Simulator and a
real Android emulator**, with a screenshot of every meaningful screen on each.

## Why not just Jest snapshots?

The component tests under `src/app/**/__tests__` use `react-test-renderer` in Node.
They serialize the React *element tree* — they never run Yoga layout, never measure text
with platform font metrics, never rasterize a pixel. So "iOS wrapped this to two lines"
is **structurally invisible** to them. To see platform rendering you have to render on
the platform and look at the output. Different tier, not an extension of the same one.

Both tiers earn their keep:

| Tier | Tool | Runs on | Catches |
|---|---|---|---|
| Domain logic | Jest (`core` project) | Node | Wrong numbers — priced by the rules engine |
| Component behaviour | Jest + `react-test-renderer` (`app`) | Node | Broken wiring, prop logic, gestures |
| **Cross-platform UI** | **Maestro** | **iOS Simulator + Android emulator** | **Platform rendering & real end-to-end flows** |

## What runs

Flows live in [`.maestro/`](../.maestro) as YAML. The **same files run on both platforms** —
`appId` is parameterized (`${APP_ID}`) and passed per platform, and screenshots are tagged
by `${PLATFORM}`.

| Flow | What it proves |
|---|---|
| `smoke.yaml` | App launches; Home, Characters, Dice, Settings, Statistics all reachable and rendered. |
| `generate-character.yaml` | The **rules engine through the UI** — Generate builds a character, prices it with the same engine that reads a real `.hdc`, and the full sheet renders. The only picker-free path to a real sheet. |
| `dice-roller.yaml` | The dice roller: a skill check and a normal-damage roll, asserting on the result surface. |
| `sheet-visual.yaml` | Opens a fixed Sample Hero and screenshots its sheet — the deterministic target for the pixel-diff gate (see [Visual regression](#visual-regression--the-character-sheet)). |
| `end-spend.yaml` | The END economy in the combat tracker — spends END and takes a Recovery, asserting the actual arithmetic on the shared pool (20 → 15 → 19), not just that taps land. |
| `combat-tracker.yaml` | The combat tracker's status effects — adds a status and clears it, asserting the add/clear state logic. |

**Why Generate and not Import?** Import uses a native document picker
(`@react-native-documents/picker`), which Maestro can't drive — and a Release build (what
CI ships) has no `__DEV__` seed, so the store starts empty. Generate needs no file system
and no dev build, so it's the reliable road to a populated character sheet. It also happens
to be the highest-value flow: it exercises the pricing engine end to end.

## Running locally

You need the app installed on a booted simulator/emulator, then point Maestro at it.
Install Maestro once: `curl -fsSL "https://get.maestro.mobile.dev" | bash`.

### iOS

```sh
# Build a standalone (JS-bundled) Release app for the simulator — no signing, no Metro.
bundle exec pod install --project-directory=ios
xcodebuild -workspace ios/herogmtools.xcworkspace -scheme herogmtools \
  -configuration Release -sdk iphonesimulator -derivedDataPath ios/build \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build

xcrun simctl boot 'iPhone 15' || true
xcrun simctl install booted "$(find ios/build/Build/Products/Release-iphonesimulator -maxdepth 1 -name '*.app' | head -1)"

npm run e2e:ios
```

### Android

```sh
# assembleRelease bundles the JS and self-signs with the committed debug key.
(cd android && ./gradlew assembleRelease)
adb install -r android/app/build/outputs/apk/release/app-release.apk

npm run e2e:android
```

Screenshots land in `maestro-artifacts/<platform>/` (git-ignored).

> **Standalone builds, on purpose.** Both platforms embed the JS bundle (iOS Release /
> Android `assembleRelease`) so the app runs with **no Metro server** to race against — the
> single biggest source of RN E2E flakiness — and **no signing secrets** (the simulator
> needs none; Android falls back to the committed debug keystore, see
> `android/app/build.gradle`).

## In CI

[`.github/workflows/mobile-ui.yml`](../.github/workflows/mobile-ui.yml) runs both platforms
on every PR and on pushes to `rebuild`:

- **iOS** on a `macos-15` runner (free for public repos — the thing that makes iOS CI viable
  without a Mac on anyone's desk; Xcode 16 there satisfies the pods' Swift 6.0).
- **Android** on `ubuntu-latest` with a KVM-accelerated emulator.

Each job builds the standalone app, boots the device, runs every flow, and uploads
**`maestro-<platform>`** artifacts: the per-screen screenshots, a JUnit report, and
Maestro's own debug output (which includes screenshots and view hierarchies on failure).
Download them from the run's *Summary → Artifacts* and eyeball iOS vs Android side by side.

## Selecting elements

Flows select by **stable `testID`** (the app has ~100), with visible text as a fallback.
Prefer ids — copy changes shouldn't break a flow. If you add a screen, forward a `testID`
on its interactive primitives (the shared `Button`, `SegmentedControl`, `ListRow`, … already
do) so it's drivable.

## Visual regression — the character sheet

Most screenshots are for **human** review. One screen is also an automated **pixel gate**: the
character sheet. The `sheet-visual` flow opens a fixed **Sample Hero** and screenshots the sheet;
CI diffs it against a committed per-platform baseline and **fails the build on a regression**.

Three things make a pixel gate trustworthy rather than flaky, and all three are wired up:

- **A deterministic screen.** A *generated* character differs every run, so it can't be a
  baseline. Instead the E2E build compiles in a fixed, engine-priced Sample Hero: the CI job
  flips [`src/app/composition/e2eSeed.ts`](../src/app/composition/e2eSeed.ts) to `true` before
  bundling, which enables the existing demo seed. **Production keeps it `false`** — the seed is
  dead code in shipped builds.
- **Per-platform baselines.** iOS and Android legitimately render differently, so they get
  separate baselines under [`.maestro/baselines/`](../.maestro/baselines). A baseline answers
  "did iOS change vs *approved iOS*", not "does iOS match Android".
- **No moving parts in frame.** The status bar clock would diff every run, so CI freezes it
  (iOS `simctl status_bar override`, Android SystemUI demo mode) and the OS image is pinned
  (`macos-15` sim / Android API 34). Even so, the status-bar *background* still flickers
  run-to-run on Android (dark vs light), so the diff **excludes system chrome** via `CROP_TOP`
  (140px Android / 160px iOS). `CROP_BOTTOM` (130/120px) drops the nav bar and the half-cut-off
  power row at the very bottom edge, and `CROP_RIGHT` (30px) drops the **scroll indicator** — a
  ~11px strip on the right that fades in and out, so whether it's caught in the shot is random.
  None of these are user-visible defects (a real user scrolls to see the clipped row; the
  scrollbar is meant to fade). The gate compares only the app's own fully-rendered content, which
  is what a visual-regression test should assert anyway. [`scripts/pixel-diff.js`](../scripts/pixel-diff.js)
  then uses `pixelmatch` with a small tolerance (default 0.1% of pixels) so sub-pixel
  antialiasing doesn't flake the gate.

When the sheet legitimately changes, the gate is *supposed* to go red — that's the signal.
Update the baseline:

1. Open the failed run's **`maestro-<platform>`** artifact and inspect `sheet.png` (the new
   render) and `sheet.diff.png` (what changed). Confirm the change is intended.
2. Copy the new `sheet.png` over `.maestro/baselines/<platform>/sheet.png` and commit it.

The first time a baseline is missing, `pixel-diff.js` establishes it from the current run and
passes — so bootstrapping a new platform is: run CI once, then commit the produced `sheet.png`.

Everything else stays an eyeball artifact. Gate the pixels where correctness lives; leave the
rest for human review. That keeps the signal high and the flakes low.
