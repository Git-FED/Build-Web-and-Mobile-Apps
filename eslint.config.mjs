// ESLint flat config for the web layer (www/).
// Keeps www/ JavaScript clean and catches common WebView pitfalls.
// Run: npx eslint www/

import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['www/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        caches: 'readonly',
        location: 'readonly',
        screen: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        URL: 'readonly',
        history: 'readonly',
        self: 'readonly',
        localStorage: 'readonly',
        matchMedia: 'readonly',
        // Capacitor globals
        Capacitor: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // console is used for runtime diagnostics
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-constant-condition': 'off',
      'no-async-promise-executor': 'error',
      'no-useless-escape': 'warn',
      'prefer-template': 'warn',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'android/**', 'ios/**', '**/build/**'],
  },
];
