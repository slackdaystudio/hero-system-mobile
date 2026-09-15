<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Notes for **2.9.1** (versionCode 71) — a one-bug hotfix, and the bug is a boot
failure rather than a wrong number.

**This is a production release, not a tester build**, which is unusual for this
repo. 2.9.0 (versionCode 70) was accepted in both stores, and the people it broke
are production users coming from **legacy 2.1.13** — not the internal testers, who
migrated long ago and cannot hit it. `migrateV1` is guarded by the `migrated_v1`
flag in `app_state`, so anyone already on the rebuild never runs that code again.

Three things to decide before shipping:

1. **Halt the 2.9.0 rollout first if it is still staged.** Every additional
   percentage point is more upgraders with large libraries, and for them the app
   does not open at all. This is the failure mode the 2.9.0 public notes warned
   about — "the one code path with real risk here runs exactly once per device, on
   first launch, over data you have never seen" — and it is exactly what happened.
2. **The affected users are not lost, and neither is their data**, which is the
   single most important thing to communicate. The `.hsmc` files are untouched on
   disk and `migrated_v1` was never stamped, so 2.9.1 imports them on the next
   launch with no action from the user. But see (3).
3. **Tell people NOT to clear app data or reinstall.** On Android both wipe
   `DocumentDirectory`, where the `.hsmc` files live — the only authoritative copy
   of their characters. That is the one action that turns a recoverable state into
   a permanent loss, and it is the first thing a frustrated user tries. If anyone
   already did it, their characters are gone; say so honestly rather than implying
   the update will bring them back.

Field limits: Play "What's new" is **500 characters**, App Store is **4000**. Both
render as plain text — no markdown.
-->

# 2.9.1 — release notes

## Play Console — "What's new" (≤500 characters)

```
Fixes a crash on startup.

If you upgraded from an older version and the app showed an error about
"CursorWindow" instead of opening, this release fixes it. Your characters are
safe — they were never deleted, and this update restores them automatically the
first time you open it.

If you have not opened the app since updating, just install this and it will
work. Please don't uninstall or clear app data first — that would delete the
characters this update is about to restore.
```

## App Store — "What's New in This Version" (≤4000 characters)

```
Fixes a crash on startup that could stop the app opening after you upgraded from
an older version.

Your characters are safe. They were never deleted, and this update restores them
automatically the first time you open it. If you have not opened the app since
updating, install this and it will work.

Please don't uninstall or clear the app's data before installing — that would
delete the character files this update is about to restore.
```

## What actually happened

The app stores your characters in two places while it upgrades: the character files
themselves, and a small index of which ones you had. On Android, that index is kept
somewhere with a hard 2 MB ceiling — and the old app tucked each character's
**portrait** into the index alongside its name. Five characters with portraits clears
2 MB comfortably.

When the app started, it read the index *before* the character files, and Android
refused to hand back anything that large. The error you saw is Android's own words for
that, passed straight through with nothing around it:

> Row to big to fit into CursorWindow requiredPos=0, totalRows=1

Because that happened before the app could record "the upgrade is done", it happened
**every time you opened it**, not just the first.

## Why most people never saw it

You had to be upgrading **from the old app** — and have enough characters, with
portraits, to clear the ceiling. Two groups were never at risk:

- **Anyone already on 2.5.0 or later.** That upgrade ran once, long ago, and never
  runs again.
- **Anyone with a small library**, or characters without portraits.

That is also why it survived testing. A fresh install passes, an emulator passes, and
every internal tester had already migrated months earlier. **The only way to see this
bug is a real phone with a real old library on it**, which is a thing testing did not
have and production did.

## What changed

- The character files are read **first** now. They were always the authoritative copy
  — the index only ever said which character was active — so nothing was ever riding
  on the part that failed.
- The index is read a second way if Android won't hand it over, which recovers it
  rather than working around it.
- **A failed upgrade can no longer stop the app starting.** If any part of it fails,
  the app opens anyway and tries again next time.
- The error screen says what went wrong in English and offers a Try Again button,
  instead of printing a line of Android's internals.

No schema change (stays at 8). No costs change on any character.

## What to check

1. **Open it.** That is the fix.
2. **Your characters are all there**, with their portraits.
3. **Close it fully and open it again** — still there, and it doesn't re-import.
4. If you are *not* coming from the old app, nothing about this build should look
   different. If something does, that's a regression and we want to hear about it.

## If you already uninstalled or cleared app data

Then the character files are gone, and this update cannot bring them back — Android
deletes them along with everything else. If you still have the original `.hdc` files
from HERO Designer, import them again. Sorry — that one is on us for shipping a screen
that gave you nothing better to try.
