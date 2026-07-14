/**
 * Three test projects:
 *  - "core":  pure-node tests for src/core (fast, no React Native runtime).
 *  - "infra": pure-node tests for src/infra — persistence runs against a real
 *             better-sqlite3 SQLite (op-sqlite is native and can't load in jest).
 *  - "app":   React Native component tests for src/app (uses the rn preset).
 * Path aliases (core/*, infra/*, app/*) resolve via babel-plugin-module-resolver.
 */

// Shared pure-node project config (core + infra). change-case is ESM-only, so it
// must be transpiled; react-native/toast (dragged in by the legacy golden-master
// oracle, or by core/util) are mapped to pure-node stubs.
const nodeProject = {
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
    },
    transformIgnorePatterns: ['/node_modules/(?!change-case/)'],
    moduleNameMapper: {
        '^react-native$': '<rootDir>/test/stubs/react-native.js',
        '^react-native-toast-message$': '<rootDir>/test/stubs/react-native-toast-message.js',
    },
};

module.exports = {
    // The golden-master suites load the real legacy engine, whose `Common` pulls in
    // the ESM-only `change-case`. Transpiling that across parallel jest workers races
    // the transform cache and intermittently fails a sibling suite; serial execution
    // is deterministic and these suites run in ~1s. Revisit if the suite grows large.
    maxWorkers: 1,
    projects: [
        {
            displayName: 'core',
            testMatch: ['<rootDir>/src/core/**/*.test.{ts,tsx}'],
            ...nodeProject,
        },
        {
            displayName: 'infra',
            testMatch: ['<rootDir>/src/infra/**/*.test.{ts,tsx}'],
            ...nodeProject,
        },
        {
            displayName: 'app',
            preset: 'react-native',
            testMatch: ['<rootDir>/src/app/**/*.test.{ts,tsx}'],
        },
    ],
};
