import { test, expect, type Page } from '@playwright/test';

const CUSTOMER = { email: 'customer1@demo.com', password: 'password' };
const ADMIN = { email: 'admin@giacom.com', password: 'password' };

async function login(page: Page, email: string, password: string, redirectPattern: RegExp) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await page.waitForURL(redirectPattern);
}

test.describe('Unauthenticated access', () => {
  test('visiting /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /customer redirects to /login', async ({ page }) => {
    await page.goto('/customer');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /customer/tickets redirects to /login', async ({ page }) => {
    await page.goto('/customer/tickets');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /admin/tickets redirects to /login', async ({ page }) => {
    await page.goto('/admin/tickets');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page is publicly accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });
});

test.describe('Customer role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CUSTOMER.email, CUSTOMER.password, /\/customer/);
  });

  test('lands on /customer after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/customer/);
  });

  test('can access /customer/tickets', async ({ page }) => {
    await page.goto('/customer/tickets');
    await expect(page).toHaveURL(/\/customer\/tickets/);
  });

  test('is redirected away from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('is redirected away from /admin/tickets to /login', async ({ page }) => {
    await page.goto('/admin/tickets');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Admin role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password, /\/admin/);
  });

  test('lands on /admin after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
  });

  test('can access /admin/tickets', async ({ page }) => {
    await page.goto('/admin/tickets');
    await expect(page).toHaveURL(/\/admin\/tickets/);
  });

  test('can access /admin/analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/\/admin\/analytics/);
  });

  test('is redirected away from /customer to /login', async ({ page }) => {
    await page.goto('/customer');
    await expect(page).toHaveURL(/\/login/);
  });
});
