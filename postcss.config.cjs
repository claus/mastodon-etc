module.exports = {
    plugins: {
        'postcss-preset-env': {
            stage: 4,
            features: {
                'nesting-rules': true,
                'color-function': true,
                'custom-media-queries': true,
            },
        },
    },
};
