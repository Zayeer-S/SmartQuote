import { defineConfig, devices } from '@playwright/test';
import { SESSION_PATHS } from './tests/e2e/constants/e2e.paths';

const SESSION_SMOKE_FILES = [
  '**/smoke/ticket.smoke.test.ts',
  '**/smoke/admin.comment.smoke.test.ts',
  '**/smoke/customer.comment.smoke.test.ts',
  '**/smoke/rate.profile.smoke.test.ts',
  '**/smoke/sla.smoke.test.ts',
  '**/smoke/org.smoke.test.ts',
];

const FLOW_FILES = ['**/flow/quote.approval.flow.test.ts'];

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'coverage/e2e/results',
  timeout: 60_000,

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 6,

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
      name: 'customer-setup',
      testMatch: '**/setup/customer.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin-setup',
      testMatch: '**/setup/admin.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'agent-setup',
      testMatch: '**/setup/agent.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'manager-setup',
      testMatch: '**/setup/manager.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // --- Unauthenticated browsers ---
    {
      name: 'chromium',
      testIgnore: [...SESSION_SMOKE_FILES, ...FLOW_FILES],
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'firefox',
      testIgnore: [...SESSION_SMOKE_FILES, ...FLOW_FILES],
      use: {
        ...devices['Desktop Firefox'],
        storageState: { cookies: [], origins: [] },
      },
    },

    // --- Authenticated browsers (admin session) ---
    {
      name: 'chromium-admin',
      testMatch: [
        '**/smoke/admin.comment.smoke.test.ts',
        '**/smoke/rate.profile.smoke.test.ts',
        '**/smoke/sla.smoke.test.ts',
        '**/smoke/org.smoke.test.ts',
      ],
      dependencies: ['admin-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: SESSION_PATHS.ADMIN,
      },
    },

    // --- Authenticated browsers (customer session) ---
    {
      name: 'chromium-customer',
      testMatch: ['**/smoke/ticket.smoke.test.ts', '**/smoke/customer.comment.smoke.test.ts'],
      dependencies: ['customer-setup', 'chromium-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: SESSION_PATHS.CUSTOMER,
      },
    },
    {
      name: 'firefox-customer',
      testMatch: ['**/smoke/ticket.smoke.test.ts', '**/smoke/customer.comment.smoke.test.ts'],
      dependencies: ['customer-setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: SESSION_PATHS.CUSTOMER,
      },
    },

    {
      name: 'flow',
      testMatch: '**/flow/quote.approval.flow.test.ts',
      dependencies: ['agent-setup', 'manager-setup', 'customer-setup'],
      use: {
        ...devices['Desktop Chrome'],
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
      command: 'npm run dev:client',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
