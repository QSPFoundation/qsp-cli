module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:node/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {},
};
