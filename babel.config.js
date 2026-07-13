module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        [
            'module-resolver',
            {
                root: ['./src'],
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
                alias: {
                    core: './src/core',
                    infra: './src/infra',
                    app: './src/app',
                },
            },
        ],
    ],
};
