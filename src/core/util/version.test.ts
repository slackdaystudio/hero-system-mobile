import {CORE_MARKER, isCoreReady} from 'core/util/version';

describe('core toolchain smoke test', () => {
    it('resolves core modules via the core/* alias in a pure-node env', () => {
        expect(CORE_MARKER).toBe('hsm-core');
        expect(isCoreReady()).toBe(true);
    });
});
