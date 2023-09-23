module.exports = {
    root: true,
    extends: '@react-native',
    plugins: [],
    rules: {
        indent: ['error', 4, {SwitchCase: 1}],
        'react-native/no-inline-styles': 0,
        'prettier/prettier': 2,
        'no-unused-vars': 2,
        'max-len': [2, 160, 4],
    },
};
