# Dependency audit

> Snapshot: **2026-11-07**, against `npm audit` on `master` at `3c3b6bc` (react-native 0.79.2).
> Previous snapshot: 2026-09-14 (24 advisories). Re-run `npm audit` and revisit this file
> whenever the numbers move.

## Read this before running `npm audit fix`

**`npm audit fix --force` is not safe in this repo.** Every "breaking" fix it offers today
is a **downgrade**, because the advisory ranges are open-ended (`>=x`) with nothing fixed
above them to move to:

| `--force` would install | We're on | Why that's wrong |
|---|---|---|
| `jest@25.1.0` | 29.7.0 | Four majors back, for a low via `create-jest` |
| `@react-native-community/cli@11.4.1` | 18.0.1 | Seven majors back, for a low via `deepmerge` |
| `@react-native/eslint-config@0.74.83` | 0.79.2 | Off our RN line, for typescript-eslint moderates |
| `babel-plugin-module-resolver@5.0.0` | 5.0.3 | Backwards, for a `glob`/`minimatch` moderate |

In the previous snapshot it was worse: `--force` "fixed" `@react-navigation/native` by
downgrading it to **3.8.4** from 7.3.8.

**Plain `npm audit fix` is currently benign, but don't rely on that.** As of this snapshot
it only moves `react-native-blob-util` 0.24.10 → 0.24.12 (see below). It has not always been
this tame: at the 2026-09-14 snapshot it resolved the metro/CLI advisories by installing a
**second, nested react-native 0.87.1** (with its own metro tree) under
`node_modules/react-native/node_modules/`, while `android/` and `ios/` are built against
0.79.2, and dragged `@react-navigation/*` up a dozen minors as a side effect. What it does
depends on what's been published since the last run.

Fix advisories **by hand**, one package at a time, and check what the lockfile actually did.
`npm update <pkg> --package-lock-only` is the safe tool for in-range bumps; diff the
lockfile's `packages` versions afterwards (#77 shows the shape).

## Current state: 25 advisories, 0 critical, 1 high

**Nothing in shipped code is flagged except `react-native-blob-util`**, and there only for a
dependency it never loads at runtime. Everything else is build or dev-server tooling that
never reaches a phone.

### Fixed since the previous snapshot

The count rose to 37 between snapshots from newly published advisories, then came back down.

| Package | Change | PR | Why |
|---|---|---|---|
| `shell-quote` | 1.10.0 → 1.12.0 | #69 | **Critical**, [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), command injection in `quote()`. Dev tooling (CLI / launch-editor). Lockfile only. |
| `launch-editor` | 2.14.1 → 2.14.2 | #70 | High ×3 ([GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) et al.). Dev server only. |
| `brace-expansion` | → 1.1.21 / 2.1.7 / 5.0.12 | #68 | High. Dev tooling. |
| `js-yaml`, `joi`, `body-parser`, `qs`, `browserslist`, `baseline-browser-mapping` | in-range patch bumps | #77 | Highs and moderates in metro, the dev server and Babel. `npm update --package-lock-only`, no `package.json` change. |
| `@react-navigation/native` / `native-stack` | 7.3.8 → 7.5.1 / 7.17.10 → 7.21.0 | #78 | **The one advisory in shipped code**: `decode-uri-component` ([GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) moderate, [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f) high) via `query-string@7`. `@react-navigation/core@7.24.0` dropped `query-string` entirely, so the chain left the tree rather than being patched. The previous snapshot said "there is nothing to upgrade to"; that was true then and stopped being true. It was also unreachable here (no `linking` prop, no deep-link intent filter). |

Closed rather than merged: **#67** (Dependabot), which "fixed" `image-size` by bumping
`react-native` to 0.87.1 in `package.json` with `android/` and `ios/` still on 0.79.2. Both
Maestro jobs failed.

Earlier fixes (2026-09-14 snapshot): `@react-native-community/cli*` 18.0.0 → 18.0.1
(critical, [GHSA-399j-vxmf-hjvr](https://github.com/advisories/GHSA-399j-vxmf-hjvr)), and
`nanoid` → 3.3.19 via `overrides` (high, ships in the bundle through `@react-navigation/core`;
the override is still in `package.json` and `nanoid` is now 3.3.20).

### Fixable now, not yet done

**`react-native-blob-util` 0.24.10 → 0.24.12 (moderate).** Flagged only via `glob@13.0.6`,
which 0.24.10 lists as a dependency and never `require`s from its JS. 0.24.11 dropped `glob`
altogether, and `^0.24.10` already allows 0.24.12, so this is a lockfile-only change, and the
whole `glob`/`minimatch`/`brace-expansion` subtree under it leaves with it.

It gets its own PR with a device check rather than riding along with anything, because
**0.24.12 is not just a manifest change**: it modifies the Android request/response classes
(`ReactNativeBlobUtilReq.java`, `…DefaultResp.java`, `…FileResp.java`), `fetch.js` and the
read stream. We use blob-util in `infra/files/nativeFileSystem.ts` and
`infra/files/nativeFileSharer.ts`, so the things to check on a phone are import, portraits and
`.hsm` share/import.

### Accepted, with reasons

**`image-size` (high).** [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq),
[GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr): infinite loops parsing
JXL/HEIF/ICNS. It's reached only through `metro@0.82.5`, the bundler, which reads our own image
assets at build time. It's not in the app. The only fix is a metro upgrade, which means the
react-native upgrade (that's what #67 was).

**`@react-native-community/cli*` (moderates and lows), `fast-xml-parser`, `deepmerge`.** The
CLI 18 toolchain that matches RN 0.79. The fix is CLI 20, which belongs to a newer
react-native.

**`@react-native/eslint-config` → `@typescript-eslint/*` → `minimatch` (moderate).** Lint only.
Moves with the RN line (`@react-native/eslint-config` is versioned with react-native).

**`babel-plugin-module-resolver` → `glob@9` → `minimatch@8` (moderate).** Build only; resolves
our `core/*` / `infra/*` / `app/*` path aliases at compile time and never sees untrusted input.
5.0.3 is the latest release; audit's suggestion is a downgrade.

**`jest`, `jest-cli`, `jest-config`, `@jest/core`, `create-jest` (low).** Test runner only.
Jest 29 is what RN 0.79's preset targets; audit's suggestion is a downgrade to 25.

**No longer listed:** the previous snapshot accepted `react-native` itself (high, via
`@react-native/community-cli-plugin`), plus `metro`, `metro-config`, `metro-transform-worker`
and `@react-native/metro-config`. None is flagged at this snapshot. `image-size` is the only
thing still reported in the metro tree.

## Added since the previous snapshot

| Package | Added | Why, and what it touches |
|---|---|---|
| `react-native-share` `^12.3.1` | 2026-11-06 | Sharing characters as `.hsm` files (#71, `docs/SHARING.md`). RN's own `Share` cannot attach a file on Android. No transitive dependencies; ships a TurboModule codegen spec (New Architecture). Its Android manifest adds **no permissions** and one FileProvider at `${applicationId}.rnshare.fileprovider`, which does not collide with react-native-blob-util's `${applicationId}.provider` (verified in the merged debug manifest). Not flagged by `npm audit`. |
| `standard-navigation` (transitive) | 2026-11-07 | Pulled in by `@react-navigation/native` 7.5 (#78). Published from the `react-navigation` GitHub org by a core maintainer; no dependencies of its own. |

## The real remediation

Nearly everything left clears itself on a **react-native upgrade** (0.79.2 → current), which
moves metro, the CLI, the eslint config and the codegen in step. That is a planned piece of
work with a device shakedown behind it (`QA_CHECKLIST.md`), not an audit fix. It is what the
audit is actually asking for, and it is the thing to schedule. Until then, the shipped app has
no open advisory once the blob-util bump lands.

## Aside: `npm test` exits 1 when green

Not an audit finding, but found during this pass: `npm test` exits **1** even when every
suite passes. Jest's `--json` report says `success: true`, with no runtime errors and no open
handles. This reproduces on `master`'s lockfile before any of the changes above. CI runs
Maestro only, not Jest, so nothing catches it. The first suspect is the "Cannot log after
tests are done" warnings from `AuthorCharacterScreen.test.tsx`.
