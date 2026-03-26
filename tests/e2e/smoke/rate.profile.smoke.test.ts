import { test, expect, type Page } from '@playwright/test';

const SETTINGS_URL = '/admin/settings';

async function openSettingsPage(page: Page): Promise<void> {
  await page.goto(SETTINGS_URL);
  await expect(page.getByTestId('admin-settings-page')).toBeVisible();
  await expect(page.getByTestId('rate-profiles-loading-row')).toBeHidden();
}

test.describe('Rate profile editing', () => {
  test.beforeEach(async ({ page }) => {
    await openSettingsPage(page);
  });

  test('settings page loads and rate profiles table is populated', async ({ page }) => {
    const table = page.getByTestId('rate-profiles-table');
    await expect(table).toBeVisible();
    await expect(page.getByTestId('rate-profiles-empty-row')).toBeHidden();
    await expect(page.getByTestId('rate-profiles-error-row')).toBeHidden();
  });

  test('clicking a row opens the edit modal pre-populated with the profile values', async ({
    page,
  }) => {
    const firstRow = page.locator('[data-testid^="rate-row-"]').first();
    await firstRow.click();

    await expect(page.getByTestId('rate-profile-modal')).toBeVisible();

    await expect(page.locator('.rpm-summary-chip').first()).toBeVisible();

    const bhInput = page.locator('#rpm-bh-rate');
    const val = await bhInput.inputValue();
    expect(val).not.toBe('');
    expect(Number(val)).toBeGreaterThan(0);

    await page.getByTestId('rpm-close-btn').click();
    await expect(page.getByTestId('rate-profile-modal')).toBeHidden();
  });

  test('valid edit succeeds: shows success banner, hides Save button, updated value appears in table', async ({
    page,
  }) => {
    const firstRow = page.locator('[data-testid^="rate-row-"]').first();
    const rowTestId = await firstRow.getAttribute('data-testid');
    const profileId = rowTestId?.replace('rate-row-', '') ?? '';

    await firstRow.click();
    await expect(page.getByTestId('rate-profile-modal')).toBeVisible();

    const bhInput = page.locator('#rpm-bh-rate');
    await bhInput.clear();
    await bhInput.fill('777');

    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.locator('.rpm-submit-success')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeHidden();

    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByTestId('rate-profile-modal')).toBeHidden();

    await expect(page.getByTestId(`rate-business-${profileId}`)).toContainText('777');
  });
});
