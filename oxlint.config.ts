import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: ["apps/web/src/routeTree.gen.ts", "**/*.md"],
  rules: {
    complexity: "allow",
    eqeqeq: "allow",
    "func-style": "allow",
    "import/no-duplicates": "allow",
    "no-duplicate-imports": "allow",
    "no-eq-null": "allow",
    "no-inline-comments": "allow",
    "no-negated-condition": "allow",
    "no-param-reassign": "allow",
    "no-shadow": "allow",
    "no-use-before-define": "allow",
    "oxc/no-barrel-file": "allow",
    "prefer-destructuring": "allow",
    "promise/prefer-await-to-callbacks": "allow",
    "require-await": "allow",
    "sort-keys": "allow",
    "typescript/no-explicit-any": "allow",
    "typescript/no-non-null-assertion": "allow",
    "unicorn/no-document-cookie": "allow",
    "unicorn/no-empty-file": "allow",
    "unicorn/no-object-as-default-parameter": "allow",
    "unicorn/prefer-logical-operator-over-ternary": "allow",
    "unicorn/prefer-native-coercion-functions": "allow",
  },
});
