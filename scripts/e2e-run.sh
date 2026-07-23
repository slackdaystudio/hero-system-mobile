#!/usr/bin/env bash
# Run the Maestro E2E flows for one platform, always collecting debug output.
#
# Usage: scripts/e2e-run.sh <ios|android> <appId>
#
# Single source of truth for both CI jobs and local runs. Kept as a real script
# (not inline YAML) so line continuations and the exit-code capture run in one
# shell — the reactivecircus/android-emulator-runner `script:` input executes
# commands in a way that breaks inline `\` continuations.
set -u

PLATFORM="${1:?platform (ios|android) required}"
APP_ID="${2:?appId required}"

maestro test .maestro \
    -e PLATFORM="$PLATFORM" \
    -e APP_ID="$APP_ID" \
    --format junit --output "maestro-report-${PLATFORM}.xml"
RC=$?

# actions/upload-artifact can't expand ~, so fold Maestro's own debug output
# (view hierarchies + on-failure screenshots) into the workspace for upload.
mkdir -p maestro-artifacts
cp -R "$HOME/.maestro/tests" maestro-artifacts/_debug 2>/dev/null || true

exit "$RC"
