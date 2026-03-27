import js from "@eslint/js";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import stylistic from "@stylistic/eslint-plugin";
import noJquery from "eslint-plugin-no-jquery";
import { fixupPluginRules, fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // Global ignores
  {
    ignores: [
      "BookReader/**",
      "coverage/**",
      "coverage-jest/**",
      "node_modules/**",
    ],
  },

  // Base recommended config
  js.configs.recommended,

  // no-jquery deprecated config (converted from eslintrc format)
  ...fixupConfigRules(
    compat.extends("plugin:no-jquery/deprecated")
  ),

  // Main config for all JS files
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],

    plugins: {
      "no-jquery": fixupPluginRules(noJquery),
      "@stylistic/js": stylistic,
    },

    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { legacyDecorators: true },
      },
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ...globals.es2020,
        ...globals.node,
        ...globals.jest,
        MediaMetadata: "readonly",
      },
    },

    rules: {
      // Stylistic rules (moved from core to @stylistic/js)
      "@stylistic/js/comma-dangle": ["error", {
        "arrays": "always-multiline",
        "objects": "always-multiline",
        "imports": "always-multiline",
        "exports": "always-multiline",
        "functions": "only-multiline",
      }],
      "@stylistic/js/semi": ["error", "always"],
      "@stylistic/js/space-before-blocks": ["error"],
      "@stylistic/js/keyword-spacing": [2, { "before": true, "after": true }],
      "@stylistic/js/indent": ["error", 2, {
        // This for some reason causing errors after switch to parser: babel-eslint.
        // See https://github.com/babel/babel-eslint/issues/681
        "ignoredNodes": ["TemplateLiteral"],
      }],
      "@stylistic/js/no-trailing-spaces": ["error"],
      "@stylistic/js/space-infix-ops": ["error", { "int32Hint": false }],
      "@stylistic/js/eol-last": ["error", "always"],

      // Core rules
      "no-console": "off", // Used too often behind `debug` options; not dealing with this now
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-unused-vars": ["error", { "vars": "all", "args": "none", "ignoreRestSiblings": false, "varsIgnorePattern": "^_" }], // set args:none; this is generally more annoying than useful
      "no-var": ["error"],
      "prefer-const": ["error"],

      // no-jquery rules
      "no-jquery/no-bind": ["error"],
      "no-jquery/no-event-shorthand": ["error"],
      "no-jquery/no-sizzle": ["error"],
      "no-jquery/no-trim": ["error"],
    },
  },

  // TestCafe e2e test globals (inlined from eslint-plugin-testcafe)
  {
    files: ["tests/e2e/**/*.js"],
    languageOptions: {
      globals: {
        fixture: "readonly",
        test: "readonly",
      },
    },
  },
];
