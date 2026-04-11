import { test, expect, type Page, request } from '@playwright/test';
import { ROLE_IDS, USERS } from '../../constants/test.user.credentials';
import type { LoginResponse } from '../../../src/shared/contracts/auth-contracts';

const ORGS_URL = '/admin/organizations';
const API_BASE = 'http://localhost:3000';

const CUSTOMER_ROLE_ID = ROLE_IDS.CUSTOMER;

async function getAdminToken(): Promise<string> {
  const ctx = await request.newContext({ baseURL: API_BASE });
  const res = await ctx.post('api/auth/login', {
    data: { email: USERS.ADMIN.EMAIL, password: USERS.ADMIN.PASSWORD },
  });
  const body = (await res.json()) as { data: LoginResponse };
  await ctx.dispose();
  return body.data.token;
}

async function createThrowawayCustomer(): Promise<string> {
  const email = `smoke-customer-${String(Date.now())}@test.invalid`;
  const ctx = await request.newContext({ baseURL: API_BASE });
  const token = await getAdminToken();

  await ctx.post('api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      email,
      firstName: 'Smoke',
      middleName: null,
      lastName: 'Customer',
      phoneNumber: '00000000000',
      password: 'Password123!',
      roleId: CUSTOMER_ROLE_ID,
    },
  });

  await ctx.dispose();
  return email;
}

async function openOrgsPage(page: Page): Promise<void> {
  await page.goto(ORGS_URL);
  await expect(page.getByTestId('admin-orgs-page')).toBeVisible();
}

async function createOrg(page: Page, name: string): Promise<void> {
  await page.getByTestId('create-org-btn').click();
  await expect(page.getByTestId('create-org-modal')).toBeVisible();
  await page.getByTestId('org-name-input').fill(name);
  await page.getByTestId('create-org-submit-btn').click();
  await expect(page.getByTestId('create-org-modal')).toBeHidden();
}

async function getFirstOrgId(page: Page): Promise<string> {
  const row = page.locator('[data-testid^="org-row-"]').first();
  const testId = await row.getAttribute('data-testid');
  return testId?.replace('org-row-', '') ?? '';
}

test.describe('Admin orgs page', () => {
  test.beforeEach(async ({ page }) => {
    await openOrgsPage(page);
  });

  test('orgs page loads and list is populated', async ({ page }) => {
    await expect(page.locator('[data-testid^="org-row-"]').first()).toBeVisible();
  });

  test('create org flow: modal opens, submits, new row appears', async ({ page }) => {
    const name = `Smoke org ${String(Date.now())}`;
    await createOrg(page, name);
    await expect(page.locator(`text=${name}`)).toBeVisible();
  });

  test('create org modal closes on cancel without creating', async ({ page }) => {
    await expect(page.locator('[data-testid^="org-row-"]').first()).toBeVisible();
    const countBefore = await page.locator('[data-testid^="org-row-"]').count();
    await page.getByTestId('create-org-btn').click();
    await expect(page.getByTestId('create-org-modal')).toBeVisible();
    await page.getByTestId('create-org-modal').getByTestId('cancel-btn').click();
    await expect(page.getByTestId('create-org-modal')).toBeHidden();
    expect(await page.locator('[data-testid^="org-row-"]').count()).toBe(countBefore);
  });

  test('edit org flow: updated name appears in list', async ({ page }) => {
    const orgId = await getFirstOrgId(page);
    const updatedName = `Edited org ${String(Date.now())}`;

    await page.getByTestId(`org-edit-btn-${orgId}`).click();
    await expect(page.getByTestId('edit-org-modal')).toBeVisible();
    await page.getByTestId('edit-org-name-input').clear();
    await page.getByTestId('edit-org-name-input').fill(updatedName);
    await page.getByTestId('edit-org-submit-btn').click();
    await expect(page.getByTestId('edit-org-modal')).toBeHidden();
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
  });

  test('members button navigates to org members page', async ({ page }) => {
    const orgId = await getFirstOrgId(page);
    await page.getByTestId(`org-members-btn-${orgId}`).click();
    await expect(page).toHaveURL(new RegExp(`/admin/organizations/${orgId}/members`));
    await expect(page.getByTestId('admin-org-members-page')).toBeVisible();
  });
});

test.describe('Admin org members page', () => {
  let orgId: string;
  let customerEmail: string;

  test.beforeEach(async ({ page }) => {
    // Each test gets a fresh throwaway customer with no org membership.
    // Created via API to avoid UI coupling and cross-test membership conflicts.
    customerEmail = await createThrowawayCustomer();

    await openOrgsPage(page);

    // Fresh org per test to avoid cross-test pollution
    const name = `Members test org ${String(Date.now())}`;
    await createOrg(page, name);

    const row = page.locator('[data-testid^="org-row-"]', { hasText: name });
    await expect(row).toBeVisible();
    const testId = await row.getAttribute('data-testid');
    orgId = testId?.replace('org-row-', '') ?? '';

    await page.getByTestId(`org-members-btn-${orgId}`).click();
    await expect(page.getByTestId('admin-org-members-page')).toBeVisible();
  });

  test('back button navigates to orgs list', async ({ page }) => {
    await page.getByTestId('back-to-orgs-btn').click();
    await expect(page).toHaveURL(new RegExp(ORGS_URL));
    await expect(page.getByTestId('admin-orgs-page')).toBeVisible();
  });

  test('empty state shown for a newly created org', async ({ page }) => {
    await expect(page.locator('.empty-state-message')).toBeVisible();
  });

  test('add member flow: member row appears with name and email', async ({ page }) => {
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-email-input').fill(customerEmail);
    await page.getByTestId('add-member-submit-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeHidden();

    await expect(page.getByTestId(`member-row-${customerEmail}`)).toBeVisible();
    await expect(page.getByTestId(`member-row-${customerEmail}`)).toContainText(customerEmail);
  });

  test('add member modal closes on cancel without adding', async ({ page }) => {
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-modal').getByTestId('cancel-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeHidden();
    await expect(page.locator('.empty-state-message')).toBeVisible();
  });

  test('adding a non-existent email shows an error', async ({ page }) => {
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-email-input').fill('nobody@nowhere.invalid');
    await page.getByTestId('add-member-submit-btn').click();
    await expect(page.getByTestId('add-member-modal').getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
  });

  test('remove member flow: member row disappears after confirmation', async ({ page }) => {
    // Seed a member first via the UI
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-email-input').fill(customerEmail);
    await page.getByTestId('add-member-submit-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeHidden();
    await expect(page.getByTestId(`member-row-${customerEmail}`)).toBeVisible();

    // Now remove
    await page.getByTestId(`remove-member-btn-${customerEmail}`).click();
    await expect(page.getByTestId('remove-member-modal')).toBeVisible();
    await page.getByTestId('remove-member-confirm-btn').click();
    await expect(page.getByTestId('remove-member-modal')).toBeHidden();
    await expect(page.getByTestId(`member-row-${customerEmail}`)).toBeHidden();
  });
});
