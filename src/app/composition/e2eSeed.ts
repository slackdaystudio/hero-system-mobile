/**
 * Build-time flag for the deterministic visual-regression fixture.
 *
 * Committed as `false` so PRODUCTION builds never seed demo data. The E2E CI build
 * overwrites this file to `true` before bundling (see .github/workflows/mobile-ui.yml),
 * so the Release binary under test contains one fixed, engine-priced character
 * (Sample Hero) for the `sheet-visual` flow to screenshot and pixel-diff.
 *
 * This is NOT a runtime toggle — it is inlined at bundle time. The shipped app has it
 * false, so the seed path (guarded here and by `__DEV__`) is dead code in production.
 */
export const E2E_SEED = false;
