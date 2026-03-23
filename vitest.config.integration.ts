import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/helpers/setup.integration.ts'],
    // Run serially to avoid DB state conflicts between test files
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        // Registers the tsx loader for the fork process so Knex can require/import
        // .ts migration and seed files without "Unknown file extension" errors
        execArgv: ['--import', 'tsx/esm'],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/server/**'],
      exclude: [
        'src/server/bootstrap/**',
        'src/server/database/migrations/**',
        'src/server/database/seeds/**',
      ],
      reportsDirectory: 'coverage/integration',
      reporter: ['text', 'lcov', 'html'],
    },
  },
});