<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0

Notes for **2.10.0** (versionCode 73, iOS build 1). One feature, character sharing
(#71), and two fixes, one of which was quietly losing data. No schema change (stays
at 8), no cost changes.

Before shipping, decide these:

1. **iOS sharing has never run on a device.** Android export and import were both
   device-tested. iOS passed Maestro in CI, but no flow opens a share sheet, so the
   iOS half of QA_CHECKLIST's "Share a character" and "Receive a shared character"
   is the gate for TestFlight → App Store. If it is not done, ship Android first.
   The App Store text below promises AirDrop and Save to Files.
2. **`cd ios && pod install` before archiving.** react-native-share is a new native
   module, so a stale Pods directory builds an app with no share sheet.
3. **Issue #71 is still open, and bob-carter is waiting on an update.** The release
   is the natural moment to post it. The readable plain-text sheet (the part that
   serves a GM without the app) is still the stretch goal. Say so rather than
   letting the release imply #71 is done.
4. **#72 lost data, and the notes say so.** A character it overwrote is gone. The
   fix stops it happening again and cannot bring one back. The text below is honest
   about that without making it sound common: it needed a delete, then a roll of the
   same archetype as a surviving character.

Field limits: Play "What's new" is **500 characters**, App Store is **4000**. Both
render as plain text, with no markdown.
-->

# 2.10.0 — release notes

## Play Console — "What's new" (≤500 characters)

```
Share your characters. Open one, tap Share, and send it by Quick Share, email,
Drive or any app. On the other phone, Import opens it, portrait and all.

Fixed: rolling a random character after deleting one could replace a character
you had saved.
Fixed: New could reopen a character you had cancelled or already saved.

No character's cost changes.
```

## App Store — "What's New in This Version" (≤4000 characters)

```
Share your characters. Open any character and tap Share in the top corner to send
it as a file: AirDrop it to the phone across the table, message it, email it, or
save it to Files. On the other phone, save the file (on iPhone, to Files), then
tap Import on the Characters screen and pick it. It arrives with its portrait and framing.

A character you rolled or built in the app arrives editable, just as it was. A
character imported from HERO Designer arrives read-only, as it is on your phone.
If the other phone already has that character, it asks: import it as a copy, or
replace the one it has.

Fixed: after deleting a random character, rolling a new one could replace a
different character you had saved, with no warning. It needed a particular mix of
characters, so most people will never have seen it, but the replaced character
could not be recovered. That can no longer happen.

Fixed: tapping New could bring back a character you had cancelled, or one you had
already saved. Saving it again made a duplicate. New now always starts empty, and
cancelling an edit to a character you built really does throw the changes away.

No character's cost changes.
```

## New: share a character

Open a character and tap **Share** in the header. The system share sheet opens with
a `.hsm` file named after the character, and anything that takes a file will take
it: Quick Share, AirDrop, Messages, email, Drive, Save to Files.

To receive one, use the **Import** button you already use for HERO Designer files.
It tells the two apart by what's inside, so a file Drive has renamed still imports.

- **The portrait and its framing come along.**
- **Edit rights come along too.** A character rolled in the app stays re-rollable,
  one built in the app keeps its Edit button, and a HERO Designer import stays
  read-only, as it is on the sender's phone.
- **If you already have that character**, it asks. **Import as copy** is the
  default, and gives you "Brick (2)" beside your Brick. **Replace** updates the
  one you have, which is what you want when a player re-sends a sheet after
  levelling up. **Cancel** changes nothing.
- **A file it can't read is refused, with a reason.** A file that isn't a HERO
  System Mobile character says so. A character from a newer version of the app
  asks you to update.

A `.hsm` is a zip with the character and its portrait inside. It's the app's own
format, not HERO Designer's: the app still reads `.hdc` files and doesn't write
them.

## Fixed: a new random character could replace a saved one

Each random character gets an id made from its archetype and a number. The number
came from counting the random characters you already had, plus one. After a
delete, that count could land on a number still in use. Saving a character
replaces whatever has the same id, so the new one overwrote the old, with no
error.

For example: keep a Tank, then a Brick, which the app numbers 2. Delete the Tank.
Roll and keep another Brick: you have one random character, so it's numbered 2
too, and it replaces your first Brick.

Numbers are now the first free one rather than a count, so a new character can't
take an id that's in use. **This doesn't bring back a character it already
replaced.** The app kept no other copy. Characters imported from HERO Designer
and characters built in the app were never affected.

## Fixed: New reopened the last draft

Characters → **New** remembered the last new character between visits. Cancel one,
tap New again, and it was still there. Save one, tap New again, and you got the
character you'd just saved under a "New character" heading. Saving it again made a
second copy. Editing a character you built in the app had the same problem in a
milder form: cancelled changes came back the next time you opened it.

Now each visit starts from scratch: New is empty, and Edit opens what's saved.
Moving between the character and one of its traits still keeps everything you've
typed.

## Under the hood

None of these changes how the app behaves. Testers can ignore this section.

- **Navigation libraries updated** (react-navigation 7.5), which removes a
  vulnerable URL-parsing dependency. The app doesn't use deep links, so it was
  never reachable, but it's gone now.
- **react-native-blob-util 0.24.12**, which drops an unused dependency that was
  flagged by a security advisory.
- **Build tooling** (React Native CLI 20) and a round of dependency security
  updates. No change to what ships to the phone beyond the two above.

## What to check

1. **Share a character to another phone and import it.** Do this both ways
   (Android → iPhone and iPhone → Android) if you have both. Check the portrait,
   the framing, and whether it's editable.
2. **Import the same file twice.** You should be asked, and each answer (copy,
   replace, cancel) should do what it says.
3. **iPhone: AirDrop a character, and Save one to Files.** This is the part least
   tested before release.
4. **New → type a name → Cancel → New.** The form should be empty.
5. **Totals should be identical to 2.9.1.** If a number moved, that's a regression,
   and we want to hear about it.
