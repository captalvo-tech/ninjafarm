import typescriptConfig from '@playcanvas/eslint-config/typescript';

export default [
    {
        ignores: [
            '.claude/**',
            '.agents/**',
            'dist/**',
            'public/ammo/**',
            'public/api/data/**',
            'scripts/*.cjs',
            'scripts/*.mjs'
        ]
    },
    ...typescriptConfig,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-extraneous-class': 'warn'
        }
    }
];
