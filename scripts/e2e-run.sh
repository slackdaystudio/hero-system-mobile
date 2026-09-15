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

FLOW_DIR='.maestro'
REPORT="maestro-report-${PLATFORM}.xml"

run_suite() {
    maestro test "$FLOW_DIR" \
        -e PLATFORM="$PLATFORM" \
        -e APP_ID="$APP_ID" \
        --format junit --output "$REPORT"
}

run_flow() {
    maestro test "${FLOW_DIR}/${1}.yaml" \
        -e PLATFORM="$PLATFORM" \
        -e APP_ID="$APP_ID" \
        --format junit --output "maestro-report-${PLATFORM}-retry-${1}.xml"
}

# Names in the JUnit report that look like they failed. Emits every candidate —
# suite names and test-case names both, since which one carries the flow name is
# Maestro's business and has changed before. The caller keeps only the ones that
# map to a real flow file, so a wrong guess costs nothing.
#
# Exits non-zero when it cannot identify anything, which the caller treats as
# "re-run everything". That fallback is the whole safety property here: a report
# this cannot parse must degrade to the old behaviour, never to a green run.
failed_flows() {
    command -v python3 >/dev/null 2>&1 || return 1

    python3 - "$1" <<'PY'
import sys
import xml.etree.ElementTree as ET

try:
    root = ET.parse(sys.argv[1]).getroot()
except Exception:
    sys.exit(2)

names = []
for suite in root.iter('testsuite'):
    broken = suite.find('failure') is not None or suite.find('error') is not None
    try:
        broken = broken or int(suite.get('failures') or 0) > 0 or int(suite.get('errors') or 0) > 0
    except ValueError:
        pass

    cases = [c for c in suite.iter('testcase') if c.find('failure') is not None or c.find('error') is not None]
    if not broken and not cases:
        continue

    for candidate in [suite.get('name')] + [c.get('name') for c in cases]:
        if candidate:
            names.append(candidate)

if not names:
    sys.exit(3)

print('\n'.join(dict.fromkeys(names)))
PY
}

# Attempt 1 runs everything; later rounds re-run only what failed.
#
# CI emulators/simulators stall a single flow's cold start (blank loading screen past
# the readiness timeout), and the Android emulator drops a GPU color buffer ("Failed to
# find ColorBuffer: N") that freezes rendering for whichever flow is mid-run. Relaunching
# the app clears the first. It does NOT clear the second — that is emulator-level state,
# and re-running all six flows inside the same emulator just burns more graphics handles
# on the way to failing again. Retrying one flow keeps that churn to a minimum; the
# emulator itself is replaced by the workflow, which runs this script a second time on a
# fresh one (see .github/workflows/mobile-ui.yml).
#
# A genuine failure still fails every round, so this recovers flakes without masking
# real breakage.
ROUNDS=3
RC=0

for round in $(seq 1 "$ROUNDS"); do
    if [ "$round" -eq 1 ]; then
        run_suite
        RC=$?
    else
        # Keep only names that are actually flows; anything else means we misread the
        # report, so fall back to the full suite rather than silently testing less.
        retry=''
        for name in $(failed_flows "$REPORT" 2>/dev/null); do
            [ -f "${FLOW_DIR}/${name}.yaml" ] && retry="${retry} ${name}"
        done

        if [ -z "$retry" ]; then
            echo "::warning::Could not identify the failed flow(s) from ${REPORT} — re-running the whole suite."
            run_suite
            RC=$?
        else
            echo "::warning::Re-running only:${retry}"
            RC=0
            for name in $retry; do
                run_flow "$name" || RC=$?
            done
        fi
    fi

    [ "$RC" -eq 0 ] && break
    if [ "$round" -lt "$ROUNDS" ]; then
        echo "::warning::Maestro failed (rc=$RC) — round ${round}/${ROUNDS}, retrying (transient cold-start / GPU stall)."
    fi
done

# actions/upload-artifact can't expand ~, so fold Maestro's own debug output
# (view hierarchies + on-failure screenshots) into the workspace for upload.
mkdir -p maestro-artifacts
cp -R "$HOME/.maestro/tests" maestro-artifacts/_debug 2>/dev/null || true

# Maestro nests takeScreenshot outputs under its per-run debug dir as
# <run>/<flow>/takeScreenshot/<the-path-we-passed>.png — i.e. each takeScreenshot dir
# already contains a maestro-artifacts/<platform>/<name>.png tree. Lift those into the
# workspace so the requested top-level paths exist (used by the visual-diff step).
#
# Sorted, so when a retried flow has run more than once the later (passing) copy lands
# last and wins. Unsorted this was a coin toss between runs; it only started to matter
# once a round could re-run one flow instead of regenerating the whole set.
find "$HOME/.maestro/tests" -type d -name takeScreenshot 2>/dev/null | sort | while read -r dir; do
    cp -R "$dir"/. . 2>/dev/null || true
done

exit "$RC"
