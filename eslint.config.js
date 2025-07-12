import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/**', 'example/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['lib/**/*.ts', 'lib/**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      // Base rules
      quotes: [2, 'single', { avoidEscape: true }],
      'no-unused-vars': 'error',
      'no-console': 'error',

      // TypeScript rules
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['lib/**/*.js', 'lib/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      quotes: [2, 'single', { avoidEscape: true }],
      'no-unused-vars': 'error',
      'no-console': 'error',
      'prettier/prettier': 'error',
    },
  },
];
