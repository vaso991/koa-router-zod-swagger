module.exports = {
    'parser': '@typescript-eslint/parser',
    'extends': [
      'plugin:@typescript-eslint/recommended'
    ],
    'plugins': ['@typescript-eslint', 'prettier'],
    'parserOptions': {
      'project': 'tsconfig.json'
    },
    'env': {
     'node': true,
     'es6': true
    },
    'rules': {
      'quotes': [2, 'single', { 'avoidEscape': true }],
      '@typescript-eslint/no-inferrable-types': "off",
      'no-unused-vars': "error",
      '@typescript-eslint/no-explicit-any': "off",
      '@typescript-eslint/no-unused-vars': "off",
      '@typescript-eslint/no-var-requires': "off",
      '@typescript-eslint/no-namespace': "off",
      '@typescript-eslint/no-non-null-assertion': "off",
      "@typescript-eslint/no-empty-interface": [ "off" ],
      "@typescript-eslint/ban-ts-comment": "off"
    }
  }