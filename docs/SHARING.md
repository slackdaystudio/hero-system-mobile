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
2. ✅ Pack/unpack — `src/infra/share/`. `packCharacter` reads the portrait off disk
   through the `FileSystem` seam (the `ImageStore` port has no read, and needs none for
   this) and stores it uncompressed. `unpackCharacter` inflates only the entries the
   manifest names, with size ceilings. `saveReceivedCharacter` states every field
   explicitly — `save`'s keep-what's-there defaults would otherwise graft the old
   character's recipe or portrait onto a replace.
3. ✅ Export UI — **Share** in the character screen's header (`AppNavigator`'s
   `ShareButton`) → `ShareProvider` → the `FileSharer` port. The device adapter
   (`infra/files/nativeFileSharer.ts`) writes into `<cache>/share/` and opens
   `react-native-share`; the file is deliberately left there after the sheet closes,
   because Android receivers read it afterwards, and the folder is emptied before the
   next share instead. Offered as `application/zip`. Always includes the portrait —
   a "without portrait" choice is a later nicety.
4. ✅ Import — the existing **Import** button takes both. `ImportProvider` sniffs the
   bytes (`isZip`: a `.hdc` is XML, so the zip signature settles it regardless of what
   Drive renamed the file to) and sends a `.hsm` through `receiveCharacter`
   (`infra/share/receive.ts`): unpack → **display gate** → clash prompt → save. The
   gate is `canDisplayCharacter` (`app/screens/characterSheet.ts`), which runs
   everything the character screen computes, in both identity modes; it is tested
   against the whole corpus and every generated archetype so it cannot falsely refuse a
   real character. The prompt is a native alert — Cancel / Replace / **Import as copy**
   (preferred); dismissing it is a cancel and writes nothing. Each failure kind gets its
   own message; a damaged file's validator detail rides on `ReceiveError.result`.

   A `.hdc` re-import still overwrites silently, as it always has — it is the player's
   own file coming back. Only shared files ask.

Later: registering `.hsm` so AirDrop / Quick Share open it directly (Android
intent filter, iOS document type), a plain-text readable sheet, QR transfer.
