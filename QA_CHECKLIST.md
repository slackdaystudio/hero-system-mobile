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
