import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'unit:client',
    environment: 'jsdom',
    include: ['tests/unit/client/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/helpers/setup.client.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/client/**'],
      exclude: ['src/client/**/*.css', 'src/client/main.tsx'],
      reportsDirectory: 'coverage/unit/client',
      reporter: ['text', 'lcov', 'html'],
    },
  },
});