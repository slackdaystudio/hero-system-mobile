/**
 * Placeholder core module used to validate the Phase 0 toolchain:
 * path aliases (`core/*`), TypeScript, and pure-node Jest all resolve this.
 * Real domain modules replace it during Phase 1.
 */
export const CORE_MARKER = 'hsm-core';

export const isCoreReady = (): boolean => CORE_MARKER.length > 0;
