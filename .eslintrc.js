module.exports = {
  "env": {
    "browser": true,
    "jquery": true,
    "es6": true,
    "node": true,
    "jest": true
  },
  "plugins": [
    "testcafe",
    "no-jquery"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:testcafe/recommended",
    "plugin:no-jquery/deprecated"
  ],
  "globals": {
    // Browser API
    "MediaMetadata": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "comma-dangle": ["error", "only-multiline"],
    "semi": ["error", "always"],
    "space-before-blocks": ["error"],
    "keyword-spacing": [2, {"before": true, "after": true}],
    "indent": ["error", 2],
    "no-console": "off", // Used too often behind `debug` options; not dealing with this now
    "no-empty": ["error", { "allowEmptyCatch": true }],
    "no-trailing-spaces": ["error"],
    "no-unused-vars": ["error", { "vars": "all", "args": "none", "ignoreRestSiblings": false }], // set args:none; this is generally more annoying than useful
    "no-var": ["error"],
    "prefer-const": ["error"],
    "space-infix-ops": ["error", { "int32Hint": false }],
    "eol-last": ["error", "always"]
  },
  "overrides": [
    { // TODO; these should be cleaned up as well
      "files": [
        "src/BookReader.js",
        "src/dragscrollable-br.js"
      ],
      "rules": {
        "no-var": ["off"],
      }
    },
  ],
};
