import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    env: { POSTHOG_PROJECT_TOKEN: '' },
    environment: 'node',
    include: ['src/**/*.test.ts', 'convex/**/*.test.ts'],
  },
})
