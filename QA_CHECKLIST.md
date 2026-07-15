<!--
Copyright 2018-Present Philip J. Guinchard — Apache-2.0
-->

# On-device QA shakedown

Manual test plan for a testing build. 1366 unit tests cover the logic; this
covers the integration + native surface they can't (picker, navigation, layout,
persistence across restarts). **Rebuild first** — the document picker is a new
native module (`npm run android`).

## Boot & Home
- [ ] Cold launch lands on the **Home** hub (title "HERO System Mobile").
- [ ] Active-character card shows your active character (portrait/name/edition);
      tapping it opens the sheet. (Known: the card loads on mount — if you change
      the active character elsewhere and return, it won't refresh until relaunch.)
- [ ] Dice tiles (Skill/To Hit/Damage/Effect) open the roller in that mode.
- [ ] Library / Statistics / Settings tiles navigate correctly.

## Import (the new one)
- [ ] Characters → **Import** → pick a real `.hdc` → it imports and opens the sheet.
- [ ] Name, edition (5E/6E), and **portrait** all came through.
- [ ] Back to the list → the imported character is there.
- [ ] Re-import the **same** file → updates in place (no duplicate row).
- [ ] Cancel the picker → no error, nothing changes.
- [ ] Import a couple of your trickier builds (VPP, multipower, frameworks).

## Delete a character
- [ ] The trash button is legible against both themes, and hittable without aiming.
- [ ] Tapping it confirms, names the right character, and does **not** open that character.
      (The unit test can only prove the wiring — react-test-renderer does no hit testing, so
      whether the nested Pressable really swallows the touch is only knowable on a device.)
- [ ] Cancel leaves the character alone; Delete removes it and the row goes.
- [ ] Scroll the list with a thumb over the rows — no accidental deletes.
- [ ] Long-press a row still confirms too (the older, hidden path).

## Generated characters
- [ ] Roll a Soldier/Spy/Royalty/Playboy → the editor asks for a **Language**; type one → the
      sheet reads "Language: French" instead of "Language: Player Defined".
- [ ] Roll a Scientist → three numbered Science Skill fields; fill two → the third still reads
      "Player Defined" and doesn't shift up.
- [ ] Name a language, then re-roll the Archetype → the language survives.
- [ ] Change Profession to another set with a language → it's still there.
- [ ] Clear a skill field → back to "Player Defined".
- [ ] Point total stays 250 through all of it (naming a skill must not move a cost).

## Portrait framing
- [ ] **Every unframed portrait looks exactly as it did before this build** — framing is opt-in and
      centred is the old crop. This is the one to check first; it affects every character.
- [ ] Tap a portrait on the sheet → the framer opens showing the current crop.
- [ ] Drag: the image follows the finger, and stops at the top and bottom edges.
- [ ] Done → the new crop shows on the sheet, the list AND Home (all three draw portraits).
- [ ] Reset → back to centred. Cancel → nothing changes.
- [ ] A wide portrait drags sideways; a square one says there's nothing to frame.
- [ ] Re-import the same `.hdc` → the framing survives (it's a column, not part of the document).
- [ ] Scroll a long list — portraits shouldn't flicker or re-measure visibly.

## Character sheet
- [ ] Character tab: characteristics + all trait sections render; costs/rolls look right.
- [ ] Tap a characteristic/skill roll → dice roller opens pre-filled.
- [ ] Long-press a roll → rolls inline, result popup, stat recorded.

## Combat tab / tracker
- [ ] Combat values correct (6E: OCV/DCV/OMCV/DMCV; 5E: figured OCV/DCV).
- [ ] Health: type damage into STUN, **Recovery** adds REC (capped), **Max** resets
      each vital (incl. BODY).
- [ ] Combat-value steppers adjust; **Reset modifiers** restores base.
- [ ] Phases: tap = acted (green), long-press = aborted (red), **New Turn** clears.
- [ ] Status effects: **Add** → each type (Aid/Drain/Entangle/Flash) shows its fields
      with **no overlap**; Apply lists it; Edit/Remove/Clear All work.
- [ ] Defenses + movement (combat/non-combat) look right.
- [ ] Change something, leave the sheet, come back → state persisted. Kill & relaunch
      the app → still persisted.

## Dice roller
- [ ] Each mode rolls correctly; **partial die** (½d6 / +1 / −1) affects damage/effect.
- [ ] Roll Again works; "Dice rolled all-time" increments.

## Statistics
- [ ] Reflects rolls made; no crash on a fresh/partial stats state.

## Settings (all live)
- [ ] Theme System/Light/Dark re-themes immediately; persists across relaunch.
- [ ] **Text size** A−/A+ scales the whole UI live; persists.
- [ ] **Screen animations** off = instant screen transitions.

## Migration (if testing over a legacy install)
- [ ] First launch imported your legacy characters + settings + stats.

## Upgrading over the previous build (2.5.0: schema 4 → 5, first time on a device)
- [ ] Install the **previous** build first, import a character or two, roll a random one.
- [ ] Install this build over the top → every character is still there, opens, and renders.
- [ ] The random character you rolled on the old build is **still editable** (migration 005
      backfills edit rights from the `generated-` id prefix — that's the only thing carrying
      them over).
- [ ] An imported `.hdc` shows **no** edit card.
- [ ] Costs may differ from 2.4.1 on imported characters — that's H3–H10/U2 landing, not a
      regression. Spot-check one against HERO Designer before reporting it.
