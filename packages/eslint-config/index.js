module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // Start gentle: surface `any` without failing CI; tighten in later phase
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow empty blocks during initial rollout; tighten later
    'no-empty': 'warn',
    // Avoid blocking on stylistic cleanup yet
    'no-useless-catch': 'warn',
    'no-useless-escape': 'warn',
  },
};
