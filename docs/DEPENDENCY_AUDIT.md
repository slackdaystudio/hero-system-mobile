# Dependency audit

> Snapshot: **2026-09-14**, against `npm audit` on `master` (react-native 0.79.2).
> Re-run `npm audit` and revisit this file whenever the numbers move.

## Read this before running `npm audit fix`

**`npm audit fix` is not safe in this repo, and neither is `--force`.**

Run plain (no `--force`), it resolves the metro/CLI advisories by installing a **second,
nested copy of react-native 0.87.1** under `node_modules/react-native/node_modules/`, with a
whole nested metro 0.87.1 tree beside it — two React Natives in one install, while
`android/` and `ios/` are built against 0.79.2. It also drags `@react-navigation/*` up a
dozen minor versions as a side effect. None of that is what the advisories asked for.

`--force` is worse: its "fix" for `@react-navigation/native` is a **downgrade to 3.8.4**
from 7.3.8, because the advisory range has no fixed version above it to move to.

Fix advisories **by hand**, one package at a time, and check what the lockfile actually did.

## Current state: 24 advisories, 0 critical

Both criticals are fixed (see below). Everything left is either build-tooling that never
reaches a phone, or gated behind a react-native major upgrade.

### Fixed

| Package | Change | Why |
|---|---|---|
| `@react-native-community/cli` (+ `-platform-android`, `-platform-ios`) | `18.0.0` → `18.0.1` | **Critical**, [GHSA-399j-vxmf-hjvr](https://github.com/advisories/GHSA-399j-vxmf-hjvr) — arbitrary OS command injection, vulnerable range `>=18.0.0 <18.0.1`. We were pinned exactly at the one bad version, and the fix is a patch bump. Dev-only, but free. |
| `nanoid` | `3.3.16` → `3.3.19` (via `overrides`) | **High**, [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8). The only fixable advisory in code that **ships in the bundle** — it arrives through `@react-navigation/core`. The dependency range already allowed the patch; only the lockfile was holding it back, so an `overrides` pin was enough. |

### Accepted, with reasons

**`decode-uri-component` → `query-string` → `@react-navigation/*` (moderate).** This is the
one remaining advisory in shipped code. Two things about it:

1. **There is nothing to upgrade to.** The advisory range is `@react-navigation/native
   <=7.3.18`, and 7.3.18 *is* the latest published version. It is fixed upstream nowhere yet.
2. **It is unreachable here.** The flaw is a DoS on malformed percent-encoded input, and
   react-navigation only parses URLs through its linking layer. This app configures no
   `linking` prop, calls no `useLinkTo`/`getStateFromPath`/`getPathFromState`, and
   `AndroidManifest.xml` declares only a `MAIN`/`LAUNCHER` intent filter — **no custom scheme,
   no App Links, no deep-link surface at all.** No attacker-controlled string reaches the
   parser.

   If a deep link is ever added, this stops being free. Re-check it then.

**`react-native` itself (high).** Flagged only *via* `@react-native/community-cli-plugin` —
the dev-server package — not for anything in the runtime. npm propagates the advisory up to
the `react-native` package because it is a dependency of it. The suggested fix is
`react-native@0.87.1`, a major upgrade of the whole app for a dev-tool issue.

**`metro`, `metro-config`, `metro-transform-worker`, `@react-native/metro-config`,
`@react-native/community-cli-plugin`, `image-size`, `js-yaml`, `brace-expansion`,
`browserslist`, `baseline-browser-mapping`, `fast-xml-parser`, and the remaining
`@react-native-community/cli*` moderates.** Build and dev-server toolchain. They run on a
developer's machine and in CI; none is bundled into the app. Their fixes are all gated behind
the same react-native 0.79 → 0.87 upgrade, or a CLI 18 → 20 major.

## The real remediation

Most of what is left clears itself on a **react-native upgrade** (0.79.2 → current), which
also moves metro, the CLI and the codegen in step. That is a planned piece of work with a
device shakedown behind it (`QA_CHECKLIST.md`), not an audit fix — but it is what the audit is
actually asking for, and it is the thing to schedule.
