module.exports = {
    'root': true,
    'extends': '@react-native-community',
    'plugins': ['unused-imports'],
    'rules': {
        'indent': ['error', 4, {'SwitchCase': 1}],
        'react-native/no-inline-styles': 0,
        'prettier/prettier': 0,
        'no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'warn',
            {
                'vars': 'all',
                'varsIgnorePattern': '^_',
                'args': 'after-used',
                'argsIgnorePattern': '^_',
            },
        ],
    },
};
