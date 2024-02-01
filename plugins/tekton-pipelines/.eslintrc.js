module.exports = {
    ...require('@backstage/cli/config/eslint-factory')(__dirname),
    rules: {
      ...require('@backstage/cli/config/eslint-factory')(__dirname).rules,
    'no-nested-ternary': 'off',
    }
}