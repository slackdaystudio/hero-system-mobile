#!/usr/bin/env bash
# Prepare a booted Android emulator and run the Maestro suite on it.
#
# Usage: scripts/e2e-android.sh <appId>
#
# Everything the emulator step does, in one file. The workflow invokes this from two
# separate `reactivecircus/android-emulator-runner` steps — the second only if the
# first failed — and each of those boots its own emulator. Keeping the body here is
# what makes the two attempts provably identical instead of two copies of a script
# block that drift apart.
set -eu

APP_ID="${1:?appId required}"

adb install -r android/app/build/outputs/apk/release/app-release.apk

# Freeze the status bar (demo mode) so the clock can't cause visual diffs.
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false
adb shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4
adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false

bash scripts/e2e-run.sh android "$APP_ID"
