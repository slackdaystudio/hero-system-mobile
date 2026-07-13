# `core/` — pure domain layer

**Invariant: nothing in `src/core/` may import `react-native`, `react`, or from
`src/infra` / `src/app`.** This is enforced by ESLint (`no-restricted-imports`).

The domain lives here — dice math, the Hero Designer character model, the trait
decorators, combat and random-character logic, and the HERO rules JSON in `data/`.
It is plain TypeScript, unit-testable in Node, and reaches platform capabilities
(randomness, persistence, files, sound) only through interfaces declared in
`core/ports`, which `src/infra` implements and `src/app` wires up.

See `REBUILD_PLAN.md` on the `master` branch for the full architecture.
