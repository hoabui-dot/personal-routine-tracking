module.exports = {
  extends: ['next/core-web-vitals'],
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unescaped-entities': 'off',
  },
};
