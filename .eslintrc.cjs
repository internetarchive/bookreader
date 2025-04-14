module.exports = {
  "parser": "@babel/eslint-parser",
  "env": {
    "browser": true,
    "jquery": true,
    "es6": true,
    "node": true,
    "jest": true,
  },
  "plugins": [
    "testcafe",
    "no-jquery",
  ],
  "extends": [
    "eslint:recommended",
    "plugin:testcafe/recommended",
    "plugin:no-jquery/deprecated",
  ],
  "globals": {
    // Browser API
    "MediaMetadata": "readonly",
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "ecmaFeatures": { "legacyDecorators": true },
    "sourceType": "module",
  },
  "rules": {
    "comma-dangle": ["error", "always-multiline", {"functions": "only-multiline"}],
    "semi": ["error", "always"],
    "space-before-blocks": ["error"],
    "keyword-spacing": [2, {"before": true, "after": true}],
    "indent": ["error", 2, {
      // This for some reason causing errors after switch to parser: babel-eslint.
      // See https://github.com/babel/babel-eslint/issues/681
      "ignoredNodes": ["TemplateLiteral"],
    }],
    "no-console": "off", // Used too often behind `debug` options; not dealing with this now
    "no-empty": ["error", { "allowEmptyCatch": true }],
    "no-jquery/no-bind": ["error"],
    "no-jquery/no-event-shorthand": ["error"],
    "no-jquery/no-sizzle": ["error"],
    "no-jquery/no-trim": ["error"],
    "no-trailing-spaces": ["error"],
    "no-unused-vars": ["error", { "vars": "all", "args": "none", "ignoreRestSiblings": false }], // set args:none; this is generally more annoying than useful
    "no-var": ["error"],
    "prefer-const": ["error"],
    "space-infix-ops": ["error", { "int32Hint": false }],
    "eol-last": ["error", "always"],
  },
};
