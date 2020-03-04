module.exports = {
    "env": {
        "browser": true,
        "jquery": true,
        "es6": true,
        "node": true,
        "jest": true
    },
    "extends": "eslint:recommended",
    "globals": {
        // Browser API
        "MediaMetadata": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "indent": ["error", 2],
        "no-console": "off", // Used too often behind `debug` options; not dealing with this now
        "no-empty": ["error", { "allowEmptyCatch": true }],
        "no-unused-vars": ["error", { "vars": "all", "args": "none", "ignoreRestSiblings": false }], // set args:none; this is generally more annoying than useful
        "no-var": ["error"],
    },
    "overrides": [
        { // TODO; these should be cleaned up as well
            "files": [
                "src/js/BookReader.js",
                "src/js/plugins/menu_toggle/plugin.menu_toggle.js",
                "src/js/plugins/plugin.archive_analytics.js",
                "src/js/plugins/tts/plugin.tts.js",
            ],
            "rules": {
                "no-var": ["off"],
            }
        },
    ],
};
