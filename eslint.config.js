//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    // Plain-JS tool configs are not part of any TypeScript project.
    ignores: ['eslint.config.js', 'prettier.config.js', 'dist/**', 'dev-dist/**'],
  },
  ...tanstackConfig,
]
