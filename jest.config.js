/**
 * Two test projects:
 *  - "core": pure-node tests for src/core (fast, no React Native runtime).
 *  - "app":  React Native tests for src/app and src/infra (uses the rn preset).
 * Path aliases (core/*, infra/*, app/*) resolve via babel-plugin-module-resolver
 * in both projects.
 */
module.exports = {
    // The golden-master suites load the real legacy engine, whose `Common` pulls in
    // the ESM-only `change-case`. Transpiling that across parallel jest workers races
    // the transform cache and intermittently fails a sibling suite; serial execution
    // is deterministic and these suites run in ~1s. Revisit if the suite grows large.
    maxWorkers: 1,
    projects: [
        {
            displayName: 'core',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/core/**/*.test.{ts,tsx}'],
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
            transform: {
                '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
            },
            // change-case is ESM-only; let babel transpile it (everything else in
            // node_modules stays ignored).
            transformIgnorePatterns: ['/node_modules/(?!change-case/)'],
            // The golden-master oracle loads the legacy engine, which imports
            // react-native (Dimensions/Platform) and the toast module. Map those to
            // pure-node stubs project-wide — deterministic across files, unlike a
            // per-test virtual jest.mock of a bare specifier that resolves into the
            // sibling worktree.
            moduleNameMapper: {
                '^react-native$': '<rootDir>/test/stubs/react-native.js',
                '^react-native-toast-message$': '<rootDir>/test/stubs/react-native-toast-message.js',
            },
        },
        {
            displayName: 'app',
            preset: 'react-native',
            testMatch: ['<rootDir>/src/app/**/*.test.{ts,tsx}', '<rootDir>/src/infra/**/*.test.{ts,tsx}'],
        },
    ],
};
