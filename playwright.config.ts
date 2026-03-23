import { defineConfig, devices } from '@playwright/test';
import { SESSION_PATHS } from './tests/e2e/constants/e2e.paths.js';

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'coverage/e2e/results',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 4,

  reporter: process.env.CI
    ? [['html', { outputFolder: 'coverage/e2e/report' }], ['github']]
    : [['html', { outputFolder: 'coverage/e2e/report' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // --- Setup projects ---
    {
      name: 'db-setup',
      testMatch: '**/setup/db.setup.ts',
    },
    {
      name: 'customer-setup',
      testMatch: '**/setup/customer.setup.ts',
      dependencies: ['db-setup'],
      use: { ...devices['Desktop Chrome'] },
    },

    // --- Unauthenticated browsers ---
    {
      name: 'chromium',
      testIgnore: '**/smoke/ticket.smoke.test.ts',
      dependencies: ['db-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'firefox',
      testIgnore: '**/smoke/ticket.smoke.test.ts',
      dependencies: ['db-setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'webkit',
      testIgnore: '**/smoke/ticket.smoke.test.ts',
      dependencies: ['db-setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: { cookies: [], origins: [] },
      },
    },

    // --- Authenticated browsers (customer session) ---
    {
      name: 'chromium-customer',
      testMatch: '**/smoke/ticket.smoke.test.ts',
      dependencies: ['customer-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: SESSION_PATHS.CUSTOMER,
      },
    },
    {
      name: 'firefox-customer',
      testMatch: '**/smoke/ticket.smoke.test.ts',
      dependencies: ['customer-setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: SESSION_PATHS.CUSTOMER,
      },
    },
    {
      name: 'webkit-customer',
      testMatch: '**/smoke/ticket.smoke.test.ts',
      dependencies: ['customer-setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: SESSION_PATHS.CUSTOMER,
      },
    },
  ],

  webServer: [
    {
      command: 'cross-env NODE_ENV=test npm run dev:server',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
