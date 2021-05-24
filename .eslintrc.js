module.exports = {
    root: true,
    extends: '@react-native-community',
    plugins: ['unused-imports'],
    rules: {
        indent: ['error', 4, {SwitchCase: 1}],
        'react-native/no-inline-styles': 0,
        'prettier/prettier': 2,
        'no-unused-vars': 2,
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'warn',
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],
        'max-len': [2, 160, 4],
    },
};
