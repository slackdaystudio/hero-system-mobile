module.exports = {
    root: true,
    extends: '@react-native',
    overrides: [
        {
            // The pure-domain invariant: src/core must not touch React Native, React,
            // or the infra/app layers. See src/core/README.md.
            files: ['src/core/**/*.{ts,tsx,js,jsx}'],
            excludedFiles: ['src/core/**/*.test.{ts,tsx,js,jsx}'],
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: [
                            {
                                group: ['react-native', 'react-native/*', 'react', 'react/*'],
                                message: 'core/ is pure TypeScript — no react-native or react imports.',
                            },
                            {
                                group: ['infra', 'infra/*', 'app', 'app/*', '**/infra/*', '**/app/*'],
                                message: 'core/ must not depend on the infra or app layers (use core/ports instead).',
                            },
                        ],
                    },
                ],
            },
        },
    ],
};
