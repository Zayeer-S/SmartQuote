import { type Page } from '@playwright/test';

export async function login(
  page: Page,
  email: string,
  password: string,
  redirectPattern: RegExp,
  rememberMe = false
) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  if (rememberMe) await page.getByTestId('remember-me-checkbox').check();
  await page.getByTestId('login-submit-btn').click();
  await page.waitForURL(redirectPattern);
}
