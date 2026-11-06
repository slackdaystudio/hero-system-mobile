# Sharing characters

GitHub issue #71 asked for a way to get a character off a phone. HERO Designer
import stays one-way — the app does **not** write `.hdc` — so sharing uses the
app's own format, moved by the platform share sheet (AirDrop, Quick Share,
Messages, email, Files).

## The `.hsm` file

A zip with at most two entries:

| Entry | Contents |
|---|---|
| `character.json` | the manifest — a `SharedCharacter` (`src/core/share/format.ts`) |
| `portrait.<ext>` | the portrait bytes, if shared; the manifest names the entry |

`.hsm` is not legacy's `.hsmc`. That was the old app's on-disk save format and
survives only as the suffix on imported characters' ids.

The manifest is a character **row**, not an HD document:

```jsonc
{
  "format": "hero-system-mobile/character",
  "formatVersion": 1,
  "exportedAt": "2026-11-06T12:00:00.000Z",          // informational
  "exportedBy": {"appVersion": "2.9.1", "schemaVersion": 8}, // informational
  "character": {
    "id": "generated-brick-1",
    "name": "Fire Brick",
    "player": "Dave",                 // or null
    "edition": "5E",                  // or "6E"
    "origin": "generated",            // "imported" | "generated" | "authored"
    "document": { … },                // the engine's output — what the sheet renders
    "recipe": { … },                  // generated only, else null
    "source": { … },                  // authored only, else null
    "portrait": {"entry": "portrait.jpg", "mime": "image/jpeg", "focus": {"x": 0.5, "y": 0.5, "scale": 1}}  // or null
  }
}
```

**`origin` travels, so edit rights travel.** An imported `.hdc` arrives read-only
— it has no recipe or source to rebuild from, and the reader rejects an import
claiming either. A generated or authored character stays editable. Opening its
editor re-prices it with the *receiving* phone's engine, which is correct but may
change a total if the two builds differ.

## Reading rules

`parseSharedCharacter` never throws. It returns one of three failures, each a
different thing to tell the player:

- `not-a-share` — not our file (missing or wrong `format` tag). "That isn't a HERO System Mobile character."
- `newer-format` — `formatVersion` above what this build reads. "Update the app to open this." Checked before
  anything else, because a newer file is expected to have a different shape.
- `malformed` — ours but damaged. `detail` is for logs, not the player.

The envelope is checked strictly; the contents are opaque. `document`, `recipe`
and `source` only have to be objects. Recipes and sources are validated when the
editor opens them (`parseRecipe` / `parseSource`), and a bad one disables editing
rather than refusing to open. A shared character gets the same treatment as a
stored one.

**The importer should still trial-render the sheet before saving.** The sheet
degrades a throwing *trait* to a stub row, but a document missing its top-level
structure is not protected by that. That check lives in `app/` (where
`characterSheet.ts` is), not here.

The portrait's `entry` must be exactly `portrait.<ext>` for its mime type
(jpeg/png/gif/webp). That whitelist is what stops a hostile manifest pointing
the unzipper at another path, so the unzipper should read **only** the entry
the parsed manifest names, never iterate the archive.

**Versioning.** Bump `SHARE_FORMAT_VERSION` only for a change an older reader
would *misread*. An optional field it can ignore needs no bump. Older versions
stay readable: add an upgrade step in `parseSharedCharacter`.

## Where it lands (`src/core/share/identity.ts`)

The sender's id travels, so a re-sent updated sheet is recognised as the same
character. It is sanitised on the way in (`shareId`) like an `.hdc` filename.

If the id is taken (`findConflict`), the player chooses:

- **Import as copy** (default) — `copyIdentity`: smallest n ≥ 2 with both `<id>-n`
  and `<name> (n)` free. `brick.hsmc` → `brick-2.hsmc`, "Brick (2)".
- **Replace** — keep the id; the incoming character overwrites the existing one.

## Pieces

1. ✅ Manifest + reader + landing rules — `src/core/share/` (this doc).
2. Pack/unpack — `infra/`: `fflate` zip of manifest + portrait; unzip reading only
   the named entries; save via `CharacterRepository.save` with `origin`, `recipe`,
   `source` stated explicitly (never defaulted), then `setPortraitFocus`.
3. Export UI — share action on the character screen; writes the `.hsm` to a temp
   file and opens the share sheet (`react-native-share` — audit entry needed).
4. Import — an `.hsm` branch beside `importHdc` in the existing file picker, with
   the replace / copy prompt.

Later: registering `.hsm` so AirDrop / Quick Share open it directly (Android
intent filter, iOS document type), a plain-text readable sheet, QR transfer.
