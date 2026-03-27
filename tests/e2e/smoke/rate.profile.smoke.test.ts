import { test, expect, type Page } from '@playwright/test';

const RATE_PROFILES_URL = '/admin/rate-profiles';

async function openRateProfilesPage(page: Page): Promise<void> {
  await page.goto(RATE_PROFILES_URL);
  await expect(page.getByTestId('admin-rate-profiles-page')).toBeVisible();
  await expect(page.getByTestId('rate-profiles-loading-row')).toBeHidden();
}

test.describe('Rate profile editing', () => {
  test.beforeEach(async ({ page }) => {
    await openRateProfilesPage(page);
  });

  test('rate profiles page loads and table is populated', async ({ page }) => {
    const table = page.getByTestId('rate-profiles-table');
    await expect(table).toBeVisible();
    await expect(page.getByTestId('rate-profiles-empty-row')).toBeHidden();
    await expect(page.getByTestId('rate-profiles-error-row')).toBeHidden();
  });

  test('clicking a row expands the inline edit row pre-populated with the profile values', async ({
    page,
  }) => {
    const firstRow = page.locator('[data-testid^="rate-row-"]').first();
    const rowTestId = await firstRow.getAttribute('data-testid');
    const profileId = rowTestId?.replace('rate-row-', '') ?? '';

    await firstRow.click();

    const editRow = page.getByTestId(`rate-profile-edit-row-${profileId}`);
    await expect(editRow).toBeVisible();

    await expect(editRow.locator('.rate-profile-chip').first()).toBeVisible();

    const bhInput = page.locator(`#rp-bh-${profileId}`);
    const val = await bhInput.inputValue();
    expect(val).not.toBe('');
    expect(Number(val)).toBeGreaterThan(0);

    // Clicking the same row again collapses the edit row
    await firstRow.click();
    await expect(editRow).toBeHidden();
  });

  test('valid edit succeeds: edit row closes and updated value appears in table', async ({
    page,
  }) => {
    const firstRow = page.locator('[data-testid^="rate-row-"]').first();
    const rowTestId = await firstRow.getAttribute('data-testid');
    const profileId = rowTestId?.replace('rate-row-', '') ?? '';

    await firstRow.click();

    const editRow = page.getByTestId(`rate-profile-edit-row-${profileId}`);
    await expect(editRow).toBeVisible();

    const bhInput = page.locator(`#rp-bh-${profileId}`);
    await bhInput.clear();
    await bhInput.fill('777');

    await editRow.getByRole('button', { name: 'Save Changes' }).click();

    await expect(editRow).toBeHidden();
    await expect(page.getByTestId(`rate-business-${profileId}`)).toContainText('777');
  });
});
