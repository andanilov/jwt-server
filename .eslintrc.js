module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'linebreak-style': 0,
    'react/function-component-definition': 0,
    'import/prefer-default-export': 0,
    'import/newline-after-import': 0,
    'react/no-array-index-key': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    'import/no-extraneous-dependencies': 0,
    'object-curly-newline': 0,
    'no-unused-expressions': 0,
    'no-underscore-dangle': 0,
    'no-param-reassign': 0,
    'operator-linebreak': 0,
    'react/jsx-filename-extension': 0,
  },
};
