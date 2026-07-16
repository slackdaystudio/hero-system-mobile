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
      (Whether the nested Pressable really swallows the touch is hit testing, which only a device
      settles — the unit test proves the wiring, not the hit.)
- [ ] Cancel leaves the character alone; Delete removes it and the row goes.
- [ ] Scroll the list with a thumb over the rows — no accidental deletes.
- [ ] Long-press a row still confirms too (the older, hidden path).

## The Generate dialog (new in 2.6.0)
- [ ] Characters → **Generate** opens the dialog, not an Alert.
- [ ] The edition pills **start on your Settings edition** (flip Settings → 5E, reopen → 5E).
- [ ] Only **5E** and **6E** are offered — `5e-standard`/`6e-low` have no data and must not appear.
- [ ] **The bar actually fills** over ~3s. It runs on the JS thread (width isn't a transform) and
      dealing five is real work, so this is the one animation that could visibly stutter. Watch the
      moment right after the tap — the deal happens there and it's the likeliest hitch.
- [ ] **Five cards** appear, all **different archetypes**, every time.
- [ ] Each card reads as a sentence: **"An Ice Powered Armor Socialite"**
      - [ ] "**An** Ice", not "A Ice". Roll until you see Ice/Air/Earth/Eldritch.
      - [ ] A Playboy/Socialite reads "**Socialite**"; an Actor/Actress reads "**Actor**". No slash.
      - [ ] An "Other" effect prints **no** effect word — "A Brick Spy", named just "Brick".
      - [ ] A long one (e.g. "An Eldritch Weapons Master Investigator") **wraps without clipping**.
- [ ] Each card shows a **stat line** (`12d6 · SPD 5 · OCV 7 / DCV 7 · DEF 28`) and it's legible.
- [ ] **Five cards fit** — the hand scrolls inside the dialog and the footer stays reachable.
- [ ] **View is disabled until you tap a card.** Tapping a card highlights it and saves nothing.
- [ ] Tap several cards in turn → the highlight follows; still nothing saved.
- [ ] **View saves the card you tapped**, not its neighbour. Check the name on the sheet against the
      card. With five on screen an off-by-one would look entirely plausible.
- [ ] **Roll Again** deals a fresh five and **forgets your selection** (View goes back to disabled).
- [ ] **Nothing is saved until View.** Roll through 5+ hands, tap cards, then Cancel/back/outside →
      the library has **no** new characters. This is the big one; the old build saved every roll.
- [ ] Settings → **Screen animations off** → Generate deals instantly, no bar, no 3s wait.
- [ ] Android **back** and tapping outside both close it, mid-deal and at the hand.
- [ ] Switching edition **while a hand is up** clears it (you must not be able to take a 5E card
      after switching to 6E).

## Generated characters — 6E (new in 2.6.0)
- [ ] Roll **6E** → the sheet says **6E**, spends **400 of 400**, and has bought
      **OCV/DCV/OMCV/DMCV** (6E figures nothing — a 5E spread here would show PD 2 / SPD 2).
- [ ] Roll a dozen and read them **like a GM**: any that look overpowered, underpowered or silly?
      These spreads are authored, not lifted — there's no 6E data we could have copied, so a
      human eye is the only oracle.
- [ ] **No VPPs** and **no Combat Skill Levels** on any 6E roll — both are deliberate.
- [ ] Re-roll a 6E character's **Archetype** → still 6E, still 400, still opens. Try
      **Mentalist / Gadgeteer / Metamorph / Powered Armor / Weapons Master** especially: those
      five name different powersets per edition, and a 5E draw there fails to save.
- [ ] Retrain a 6E **Profession** → still 400.
- [ ] A 6E Scientist asks for a **language** as well as sciences (the 5E one doesn't).

## Generated characters — skills and editing
- [ ] Roll a Soldier/Spy/Royalty/Playboy → the editor asks for a **Language**; type one → the
      sheet reads "Language: French" instead of "Language: Player Defined".
- [ ] Roll a Scientist → three numbered Science Skill fields; fill two → the third still reads
      "Player Defined" and doesn't shift up.
- [ ] Name a language, then re-roll the Archetype → the language survives.
- [ ] Change Profession to another set with a language → it's still there.
- [ ] Clear a skill field → back to "Player Defined".
- [ ] Point total stays at its full budget through all of it — **250** for 5E, **400** for 6E.
      Naming a skill must not move a cost.

## Portrait framing
- [ ] **Every unframed portrait looks exactly as it did before this build** — framing is opt-in and
      centred is the old crop. This is the one to check first; it affects every character.
- [ ] Tap a portrait on the sheet → the framer opens showing the current crop.
- [ ] Drag: the image follows the finger and **stays where you put it** (it used to snap back —
      the responder was being rebuilt mid-gesture). Stops at the edges.
- [ ] **Zoom –/+ buttons work** (these are the guaranteed path; pinch is the nice one).
- [ ] Pinch to zoom, 1x to 4x. Two bugs lived here: reading nativeEvent.touches (target-filtered,
      never carried the 2nd finger), and only handling onPanResponderMove (RN routes multi-touch
      moves through the capture dispatch instead, so the handler never ran). Both now covered by
      tests that drive the real PanResponder.
- [ ] Pinch a second time in the same session — lifted fingers leave stale entries in the bank,
      so this is where a ghost finger would show up.
- [ ] Zoomed in, a tall portrait can be dragged sideways too.
- [ ] Zoom out past 1x → stops at cover; the square never letterboxes.
- [ ] Start a drag, add a second finger to pinch, lift it, keep dragging — no jump at each change.
- [ ] Done → the new crop shows on the sheet, the list AND Home (all three draw portraits).
- [ ] Reset → back to centred. Cancel → nothing changes.
- [ ] A wide portrait drags sideways; a square one says there's nothing to frame.
- [ ] Re-import the same `.hdc` → the framing survives (it's a column, not part of the document).
- [ ] Scroll a long list — portraits shouldn't flicker or re-measure visibly.

## Character sheet
- [ ] Character tab: characteristics + all trait sections render; costs/rolls look right.
- [ ] Tap a characteristic/skill roll → dice roller opens pre-filled.
- [ ] Long-press a roll → rolls inline, result popup, stat recorded.

## Strength damage (new in 2.6.0 — restored from the old app)
- [ ] **"Damage: 12d6" appears under STR** on a 60-STR Brick, and under **no other** characteristic.
- [ ] Tap it → dice roller opens pre-filled for **Normal Damage** (not a skill check), 12 dice.
- [ ] Long-press it → rolls inline, popup says **Normal Damage**, STUN/BODY/Knockback shown.
- [ ] The dice match the STR above it: **STR/5, and +3 or +4 over that is a half-die.**
      - [ ] STR 60 → `12d6`, STR 61/62 → `12d6`, STR 63/64 → `12½d6`, STR 65 → `13d6`.
      - [ ] A low-STR character (say 10) reads `2d6`, not blank and not `0d6`.
- [ ] A character whose STR comes from a **power** (Density Increase, Growth) punches with the
      total the row shows, not the bought value.
- [ ] On a character with an **Only In Alternate Identity** STR, the damage and the total agree —
      toggling the identity must move both or neither, never one.

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

## Upgrading over the previous build (2.6.0: schema 5 → 7)
- [ ] Install **2.5.0** first, import a character or two with portraits, roll a random one.
- [ ] Install this build over the top → every character is still there, opens, and renders.
- [ ] **Every portrait looks exactly as it did in 2.5.0** — migrations 006/007 are additive and
      an unframed portrait reads `null`, which is the centre crop it already had.
- [ ] The random character you rolled on 2.5.0 is **still editable**, and still 5E/250.
- [ ] **No cost moves anywhere.** 2.5.0 was the build that changed costs; nothing in 2.6.0 changes
      how a point is priced. A **cost** that differs from 2.5.0 is a **regression** — report it.
- [ ] **One damage roll legitimately moves:** a Hand-To-Hand Attack whose `levels + STR/5` lands on
      a half-die (e.g. STR 63, or STR 13 with a 2d6 HA) now reads `N½d6` where it read `Nd6` — H11.
      Everything else, including every cost, is byte-identical. No fixture in the corpus has one,
      so a real character is the only way to see this.

## Upgrading from 2.4.1 (schema 4 → 7 in one hop — only if a tester skipped 2.5.0)
- [ ] Every character survives both hops.
- [ ] The random character rolled on the old build is **still editable** (migration 005
      backfills edit rights from the `generated-` id prefix — that's the only thing carrying
      them over).
- [ ] An imported `.hdc` shows **no** edit card.
- [ ] Costs may differ from 2.4.1 on imported characters — that's H3–H10/U2 landing in 2.5.0,
      not a regression. Spot-check one against HERO Designer before reporting it.
