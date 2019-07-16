module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
  },
  'extends': 'airbnb-base',
  "plugins": [
    "json"
  ],
  'parserOptions': {
    'sourceType': 'module',
  },
  rules: {
    'max-len': 'warn',
    'comma-dangle': ['error', 'never'],
  },
};