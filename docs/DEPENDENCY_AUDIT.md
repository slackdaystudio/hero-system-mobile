# Dependency audit

> Snapshot: **2026-11-08**, against `npm audit` on `master` at `75dc50e` (react-native 0.79.2,
> CLI 20.2.0). Earlier snapshots: 2026-11-07 (25), 2026-09-14 (24). Re-run `npm audit` and
> revisit this file whenever the numbers move.

## Read this before running `npm audit fix`

**`npm audit fix --force` is not safe in this repo.** Every "breaking" fix it offers is a
**downgrade**, because the advisory ranges are open-ended (`>=x`) with nothing fixed above
them to move to:

| `--force` would install | We're on | Why that's wrong |
|---|---|---|
| `jest@25.1.0` | 29.7.0 | Four majors back, for a low via `create-jest` |
| `@react-native-community/cli@11.4.1` | 20.2.0 | Nine majors back, for a low via `deepmerge` |
| `@react-native/eslint-config@0.74.83` | 0.79.2 | Off our RN line, for typescript-eslint moderates |
| `babel-plugin-module-resolver@5.0.0` | 5.0.3 | Backwards, for a `glob`/`minimatch` moderate |

In the 2026-09-14 snapshot it was worse: `--force` "fixed" `@react-navigation/native` by
downgrading it to **3.8.4** from 7.3.8.

**Plain `npm audit fix` currently does nothing**: every remaining advisory needs `--force`.
Don't take that as a standing guarantee. At the 2026-09-14 snapshot it resolved the
metro/CLI advisories by installing a **second, nested react-native 0.87.1** (with its own
metro tree) under `node_modules/react-native/node_modules/`, while `android/` and `ios/` are
built against 0.79.2, and dragged `@react-navigation/*` up a dozen minors as a side effect.
What it does depends on what's been published since the last run.

Fix advisories **by hand**, one package at a time, and check what the lockfile actually did.
`npm update <pkg> --package-lock-only` is the safe tool for in-range bumps; diff the
lockfile's `packages` versions afterwards (#77 shows the shape).

## Dependabot

`.github/dependabot.yml` runs npm in **security-updates-only** mode
(`open-pull-requests-limit: 0`; security PRs have their own fixed limit) and **ignores
`react-native` and `@react-native/*` at `>=0.80.0`**. Without that rule, Dependabot "fixes"
the metro/`image-size` advisory by rewriting `react-native` in `package.json` while `android/`
and `ios/` stay on 0.79.2. It did this twice (#67 → 0.87.1, #76 → 0.88.1); both failed Maestro
and were closed. `ignore` applies to security updates too, which is what makes it work.

It's a version range rather than `update-types: version-update:semver-major` because
react-native is 0.x: to semver, 0.79 → 0.88 is a *minor* bump, and a major-only rule would
let it through. **When the react-native upgrade lands, move the ranges up with it.**

Every other Dependabot PR is still worth reading rather than merging on a green check. #81
(CLI 18 → 20) was merged only after confirming `react-native config` (the autolinking that
Gradle and the Podfile both read) was identical across all seven native modules.

## Current state: 19 advisories, 0 critical, 1 high

**No advisory touches code that ships in the app.** Everything left is build, lint, test or
dev-server tooling that never reaches a phone, and nearly all of it is waiting on the
react-native upgrade.

### Fixed since the 2026-09-14 snapshot

The count rose to 37 between snapshots from newly published advisories, then came back down.

| Package | Change | PR | Why |
|---|---|---|---|
| `shell-quote` | 1.10.0 → 1.12.0 | #69 | **Critical**, [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), command injection in `quote()`. Dev tooling (CLI / launch-editor). Lockfile only. |
| `launch-editor` | 2.14.1 → 2.14.2 | #70 | High ×3 ([GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) et al.). Dev server only. |
| `brace-expansion` | → 1.1.21 / 2.1.7 / 5.0.12 | #68 | High. Dev tooling. |
| `js-yaml`, `joi`, `body-parser`, `qs`, `browserslist`, `baseline-browser-mapping` | in-range patch bumps | #77 | Highs and moderates in metro, the dev server and Babel. `npm update --package-lock-only`, no `package.json` change. |
| `@react-navigation/native` / `native-stack` | 7.3.8 → 7.5.1 / 7.17.10 → 7.21.0 | #78 | **Shipped code**: `decode-uri-component` ([GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) moderate, [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f) high) via `query-string@7`. `@react-navigation/core@7.24.0` dropped `query-string` entirely, so the chain left the tree rather than being patched. The 2026-09-14 snapshot said "there is nothing to upgrade to"; that was true then and stopped being true. It was also unreachable here (no `linking` prop, no deep-link intent filter). |
| `react-native-blob-util` | 0.24.10 → 0.24.12 | #80 | **Shipped code**, moderate, via `glob@13`, which 0.24.10 declared and never `require`d. 0.24.11 dropped it, taking the `glob`/`minimatch`/`brace-expansion` subtree with it. Lockfile only. The rest of the diff is in blob-util's HTTP `fetch` path, which we don't use (we only call `ReactNativeBlobUtil.fs`): an `appendExt` path-traversal guard, progress-reporting fixes, and a fix for a 0.24.10 regression that failed downloads over 8 KB. |
| `@react-native-community/cli` (+ `-platform-android`, `-platform-ios`) | 18.0.1 → 20.2.0 | #81 (Dependabot) | `fast-xml-parser`, `cli-config-android`, `cli-platform-android/apple/ios` moderates. A CLI major, but autolinking output (`react-native config`) is identical on 18 and 20, both Maestro jobs passed, and jest is green. **CLI 20 needs Node ≥ 20.19.4**; `engines.node` says so now. It also re-hoists some shared transitive packages (`body-parser` 1 → 2, `pretty-format` 26 → 29, `react-is` 17 → 18), none of which our code imports directly. |

Closed rather than merged: **#67** and **#76** (Dependabot). See [Dependabot](#dependabot).

Earlier fixes (2026-09-14 snapshot): `@react-native-community/cli*` 18.0.0 → 18.0.1
(critical, [GHSA-399j-vxmf-hjvr](https://github.com/advisories/GHSA-399j-vxmf-hjvr)), and
`nanoid` → 3.3.19 via `overrides` (high, ships in the bundle through `@react-navigation/core`;
the override is still in `package.json` and `nanoid` is now 3.3.20).

### Accepted, with reasons

**`image-size` (high).** [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq),
[GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr): infinite loops parsing
JXL/HEIF/ICNS. It's reached only through `metro@0.82.5`, the bundler, which reads our own image
assets at build time. It's not in the app. The only fix is a metro upgrade, which means the
react-native upgrade (that's what #67 and #76 were).

**`@react-native-community/cli`, `cli-config`, `cli-doctor`, `deepmerge` (low).** The
advisory range is open-ended (`>=11`), so there is no newer CLI that clears it, and the only
"fix" is a downgrade.

**`@react-native/eslint-config` → `@typescript-eslint/*` → `minimatch` (moderate).** Lint only.
Moves with the RN line (`@react-native/eslint-config` is versioned with react-native).

**`babel-plugin-module-resolver` → `glob@9` → `minimatch@8` (moderate).** Build only; resolves
our `core/*` / `infra/*` / `app/*` path aliases at compile time and never sees untrusted input.
5.0.3 is the latest release; audit's suggestion is a downgrade.

**`jest`, `jest-cli`, `jest-config`, `@jest/core`, `create-jest` (low).** Test runner only.
Jest 29 is what RN 0.79's preset targets; audit's suggestion is a downgrade to 25.

**No longer listed:** the 2026-09-14 snapshot accepted `react-native` itself (high, via
`@react-native/community-cli-plugin`), plus `metro`, `metro-config`, `metro-transform-worker`
and `@react-native/metro-config`. None is flagged now. `image-size` is the only thing still
reported in the metro tree.

## Added since the 2026-09-14 snapshot

| Package | Added | Why, and what it touches |
|---|---|---|
| `react-native-share` `^12.3.1` | 2026-11-06 | Sharing characters as `.hsm` files (#71, `docs/SHARING.md`). RN's own `Share` cannot attach a file on Android. No transitive dependencies; ships a TurboModule codegen spec (New Architecture). Its Android manifest adds **no permissions** and one FileProvider at `${applicationId}.rnshare.fileprovider`, which does not collide with react-native-blob-util's `${applicationId}.provider` (verified in the merged debug manifest). Not flagged by `npm audit`. |
| `standard-navigation` (transitive) | 2026-11-07 | Pulled in by `@react-navigation/native` 7.5 (#78). Published from the `react-navigation` GitHub org by a core maintainer; no dependencies of its own. |

## The real remediation

Nearly everything left clears itself on a **react-native upgrade** (0.79.2 → current), which
moves metro, the eslint config and the codegen in step. That is a planned piece of work with a
device shakedown behind it (`QA_CHECKLIST.md`), not an audit fix. It is what the audit is
actually asking for, and it is the thing to schedule. When it happens, update the
`ignore` ranges in `.github/dependabot.yml` in the same PR.
