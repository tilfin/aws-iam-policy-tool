module.exports = {
  "extends": ["prettier", "plugin:@typescript-eslint/recommended"],
  "overrides": [
    {
      "files": ["*.ts"]
    }
  ],
  "plugins": [
    "@typescript-eslint"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "rules": {
    "comma-dangle": ["error", "always-multiline"],
    "linebreak-style": ["error", "unix"],
    "no-console": ["warn"],
    "no-trailing-spaces": ["error"],
    "quotes": ["error", "single", { avoidEscape: true }],
    "indent": "off",
    "@typescript-eslint/indent": ["error", 2],
    "semi": "off",
    "@typescript-eslint/semi": ["error", "never"],
    'object-shorthand': ['error', 'always', { avoidQuotes: true }],
  }
}
