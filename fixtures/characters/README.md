# Character fixture corpus (`.hdc`)

Real HERO Designer character exports used as the **golden-master corpus** for the
`hero/` + `traits/` rules-engine port (see `docs/HERO_TRAITS_SLICE.md`).

## What goes here

- Raw **`.hdc`** files (HERO Designer XML exports). Drop them straight into this
  directory. Original or descriptive filenames are both fine.
- These are *source inputs*, not test code: the build pipeline parses each one
  (via the legacy `File`/xml2js path) into JSON fixtures under
  `src/core/hero/__tests__/fixtures/`, which is what the core golden-master tests
  actually import. This directory stays out of `tsc`/`jest`/`eslint` scope.

## Coverage this corpus should span

Editions **5E and 6E**; genres Heroic / Superheroic / Normal / Automaton / AI /
Computer; frameworks multipower / elemental control / VPP / compound power;
martial arts; the range of skills, perks, talents, powers (attack/defense/
movement/adjustment), complications, and equipment. See the checklist in
`docs/HERO_TRAITS_SLICE.md` for the full matrix.

## Notes

- **Portraits:** `.hdc` files may embed a base64 portrait in an `<image>` tag,
  which bloats the file. That's fine to leave in — the parse step strips portraits
  out of the committed JSON fixtures (cost/roll math doesn't need them).
- **Privacy:** these are committed to the repo (public). They're user-submitted,
  so anonymize character/player names on any that need it before dropping them in.
