module.exports = {
    ...require('@madeinhaus/prettier-config'),
    printWidth: 100,
    plugins: ['prettier-plugin-astro'],
    overrides: [
        {
            files: '*.astro',
            options: {
                parser: 'astro',
            },
        },
    ],
};
