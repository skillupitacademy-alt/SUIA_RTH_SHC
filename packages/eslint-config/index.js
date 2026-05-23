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
    // Allow empty blocks during initial rollout; tighten later
    'no-empty': 'warn',
    // Avoid blocking on stylistic cleanup yet
    'no-useless-catch': 'warn',
    'no-useless-escape': 'warn',
    // Disable: @typescript-eslint v8 implementation crashes when paired with ESLint v8
    // (the rule passes context options incompatibly to the base ESLint rule).
    '@typescript-eslint/no-unused-expressions': 'off',
  },
};
