module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:jsdoc/recommended"],
  ignorePatterns: ["dist"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
  settings: {
    jsdoc: {
      mode: "typescript",
    },
  },
};
