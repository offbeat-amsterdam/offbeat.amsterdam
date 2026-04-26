module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    'jest/globals': true
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    babelOptions: {
      babelrc: false,
      configFile: false
    }
  },
  extends: [
    '@nuxtjs/eslint-config'
    // 'plugin:nuxt/recommended',
    // 'plugin:prettier/recommended',
    // 'prettier',
    // 'prettier/vue'
  ],
  plugins: [
    'prettier',
    'jest'
  ],
  // add your custom rules here
  rules: {
    'nuxt/no-cjs-in-config': 'off',
    camelcase: 'off',
    'no-console': 'off',
    'arrow-parens': 'off',
    'import/order': 'off',
    'space-in-parens': 'off',
    'eol-last': 'off'
  }
}
