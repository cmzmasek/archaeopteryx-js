// ESLint flat config for Archaeopteryx.js.
//
// This is a pragmatic "bootstrap" configuration for a large legacy codebase:
// it catches genuine bugs (undeclared variables, duplicate object keys,
// unreachable code, ...) as errors, while the noisier stylistic rules are
// downgraded to warnings so they can be cleaned up incrementally without
// blocking CI. Formatting is handled separately by Prettier.

import js from '@eslint/js';
import globals from 'globals';

// Rules relaxed from eslint:recommended so that the existing legacy code lints
// clean (0 errors). Tighten these back to "error" as the code is cleaned up.
const legacyRelaxations = {
    'no-unused-vars': 'warn',
    'no-redeclare': 'warn',
    'no-empty': 'warn',
    'no-fallthrough': 'warn',
    'no-cond-assign': 'warn',
    'no-constant-condition': 'warn',
    'no-inner-declarations': 'warn',
    'no-useless-escape': 'warn',
    'no-prototype-builtins': 'off',
    'no-control-regex': 'off',
};

export default [
    {
        ignores: [
            'node_modules/**',
            'dependencies/**',
            'test/data/**',
            'test/lib/**',
        ],
    },

    // Browser library files: plain scripts that rely on third-party globals
    // (d3, jQuery, ...) and expose themselves via window / module.exports.
    {
        files: ['archaeopteryx.js', 'forester.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.node, // module, global, require (UMD-style export)
                d3: 'readonly',
                forester: 'readonly',
                phyloXml: 'readonly',
                phyloxml: 'readonly',
                canvg: 'readonly',
                RGBColor: 'readonly',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...legacyRelaxations,
        },
    },

    // Node test files (CommonJS).
    {
        files: ['test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...legacyRelaxations,
        },
    },
];
