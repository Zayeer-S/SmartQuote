import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit:server',
    environment: 'node',
    include: ['tests/unit/server/**/*.test.ts'],
    setupFiles: ['tests/helpers/setup.server.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/server/**'],
      exclude: [
        'src/server/bootstrap/**',
        'src/server/database/migrations/**',
        'src/server/database/seeds/**',
      ],
      reportsDirectory: 'coverage/unit/server',
      reporter: ['text', 'lcov', 'html'],
    },
  },
});