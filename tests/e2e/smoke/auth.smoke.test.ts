import { test, expect } from '@playwright/test';
import { login } from '../utils/login.utils';
import { USERS } from '../../constants/test.user.credentials';

const CUSTOMER = {
  email: USERS.CUSTOMER1_DIFF_ORG.EMAIL,
  password: USERS.CUSTOMER1_DIFF_ORG.PASSWORD,
};
const ADMIN = { email: USERS.ADMIN.EMAIL, password: USERS.ADMIN.PASSWORD };

test.describe('Unauthenticated access', () => {
  test('visiting /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /customer redirects to /login', async ({ page }) => {
    await page.goto('/customer');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /customer/settings redirects to /login', async ({ page }) => {
    await page.goto('/customer/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /admin/settings redirects to /login', async ({ page }) => {
    await page.goto('/admin/settings');
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

  test('can access /customer/settings', async ({ page }) => {
    await page.goto('/customer/settings');
    await expect(page).toHaveURL(/\/customer\/settings/);
  });

  test('is redirected away from /admin to /insufficient-permissions', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/insufficient-permissions/);
  });

  test('is redirected away from /admin/settings to /insufficient-permissions', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/insufficient-permissions/);
  });
});

test.describe('Admin role', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password, /\/admin/);
  });

  test('lands on /admin after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
  });

  test('can access /admin/rate-profiles', async ({ page }) => {
    await page.goto('/admin/rate-profiles');
    await expect(page).toHaveURL(/\/admin\/rate-profiles/);
  });

  test('can access /admin/settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings/);
  });

  test('is redirected away from /customer to /insufficient-permissions', async ({ page }) => {
    await page.goto('/customer');
    await expect(page).toHaveURL(/\/insufficient-permissions/);
  });
});
