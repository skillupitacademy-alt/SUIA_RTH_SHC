module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jsx-a11y'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:jsx-a11y/strict'],
  rules: {
    // Start gentle: surface `any` without failing CI; tighten in later phase
    '@typescript-eslint/no-explicit-any': 'warn',
    // typescript-eslint v8 on legacy config can mis-handle default options here
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: false,
        allowTernary: false,
        allowTaggedTemplates: false,
        enforceForJSX: false,
      },
    ],
    // Allow empty blocks during initial rollout; tighten later
    'no-empty': 'warn',
    // Avoid blocking on stylistic cleanup yet
    'no-useless-catch': 'warn',
    'no-useless-escape': 'warn',
  },
};
