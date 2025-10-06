module.exports = {
  root: true,
  extends: ['@react-native'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'react-native/no-inline-styles': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': 'warn',
  },
  settings: {
    'import/resolver': {
      'babel-plugin-module-resolver': {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    },
  },
};
