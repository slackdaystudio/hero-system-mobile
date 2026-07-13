/**
 * Two test projects:
 *  - "core": pure-node tests for src/core (fast, no React Native runtime).
 *  - "app":  React Native tests for src/app and src/infra (uses the rn preset).
 * Path aliases (core/*, infra/*, app/*) resolve via babel-plugin-module-resolver
 * in both projects.
 */
module.exports = {
    projects: [
        {
            displayName: 'core',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/core/**/*.test.{ts,tsx}'],
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
            transform: {
                '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
            },
        },
        {
            displayName: 'app',
            preset: 'react-native',
            testMatch: ['<rootDir>/src/app/**/*.test.{ts,tsx}', '<rootDir>/src/infra/**/*.test.{ts,tsx}'],
        },
    ],
};
