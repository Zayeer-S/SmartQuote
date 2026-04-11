import { test, expect, type Page, request } from '@playwright/test';
import { ROLE_IDS, USERS } from '../../constants/test.user.credentials';
import type { LoginResponse } from '../../../src/shared/contracts/auth-contracts';

const ORGS_URL = '/admin/organizations';
const API_BASE = 'http://localhost:3000';

const CUSTOMER_ROLE_ID = ROLE_IDS.CUSTOMER;

let cachedAdminToken: string | null = null;

async function getAdminToken(): Promise<string> {
  if (cachedAdminToken) return cachedAdminToken;
  const ctx = await request.newContext({ baseURL: API_BASE });
  const res = await ctx.post('api/auth/login', {
    data: { email: USERS.ADMIN.EMAIL, password: USERS.ADMIN.PASSWORD },
  });
  const body = (await res.json()) as { data: LoginResponse };
  await ctx.dispose();
  cachedAdminToken = body.data.token;
  return cachedAdminToken;
}

async function createThrowawayCustomer(token: string): Promise<string> {
  const email = `smoke-customer-${String(Date.now())}@test.invalid`;
  const ctx = await request.newContext({ baseURL: API_BASE });

  const res = await ctx.post('api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      email,
      firstName: 'Smoke',
      lastName: 'Customer',
      phoneNumber: '+447911123456',
      password: 'Password123!',
      roleId: CUSTOMER_ROLE_ID,
    },
  });

  await ctx.dispose();

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`createThrowawayCustomer failed (${String(res.status())}): ${body}`);
  }

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
  let adminToken: string;

  test.beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  test.beforeEach(async ({ page }) => {
    // Each test gets a fresh throwaway customer with no org membership.
    // Created via API to avoid UI coupling and cross-test membership conflicts.
    customerEmail = await createThrowawayCustomer(adminToken);

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

  /**  TODO FIX THIS TEST
  test('adding a non-existent email shows an error', async ({ page }) => {
    const nonExistentEmail = `no-such-user-${String(Date.now())}@example.com`;
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-email-input').fill(nonExistentEmail);
    await page.getByTestId('add-member-submit-btn').click();
    await expect(page.getByTestId('add-member-modal').getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
  });
  */

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

  test('new member shows Member role badge', async ({ page }) => {
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-email-input').fill(customerEmail);
    await page.getByTestId('add-member-submit-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeHidden();

    await expect(page.getByTestId(`member-role-badge-${customerEmail}`)).toBeVisible();
    await expect(page.getByTestId(`member-role-badge-${customerEmail}`)).toHaveText('Member');
  });

  test('promote flow: badge updates to Manager', async ({ page }) => {
    // Add the member first
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-email-input').fill(customerEmail);
    await page.getByTestId('add-member-submit-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeHidden();
    await expect(page.getByTestId(`member-row-${customerEmail}`)).toBeVisible();

    // Promote
    await page.getByTestId(`update-member-role-btn-${customerEmail}`).click();
    await expect(page.getByTestId('update-member-role-modal')).toBeVisible();
    await page.getByTestId('update-member-role-confirm-btn').click();
    await expect(page.getByTestId('update-member-role-modal')).toBeHidden();

    await expect(page.getByTestId(`member-role-badge-${customerEmail}`)).toHaveText('Manager');
    await expect(page.getByTestId(`update-member-role-btn-${customerEmail}`)).toHaveText('Demote');
  });

  test('demote flow: badge updates back to Member', async ({ page }) => {
    // Add and promote first via API to avoid chaining UI steps
    const ctx = await request.newContext({ baseURL: API_BASE });

    // Add via API
    await ctx.post(`api/orgs/${orgId}/members`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { email: customerEmail },
    });
    // Promote via API
    const membersRes = await ctx.get(`api/orgs/${orgId}/members`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const membersBody = (await membersRes.json()) as {
      data: { members: { userId: string; email: string }[] };
    };
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!membersBody.data?.members) {
      throw new Error(`listMembers returned no data: ${JSON.stringify(membersBody)}`);
    }
    const member = membersBody.data.members.find((m) => m.email === customerEmail);
    await ctx.patch(`api/orgs/${orgId}/members/${member?.userId ?? ''}/role`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { role: 'Manager' },
    });
    await ctx.dispose();

    // Reload so the page reflects the seeded state
    await page.reload();
    await expect(page.getByTestId('admin-org-members-page')).toBeVisible();
    await expect(page.getByTestId(`member-role-badge-${customerEmail}`)).toHaveText('Manager');

    // Demote via UI
    await page.getByTestId(`update-member-role-btn-${customerEmail}`).click();
    await expect(page.getByTestId('update-member-role-modal')).toBeVisible();
    await page.getByTestId('update-member-role-confirm-btn').click();
    await expect(page.getByTestId('update-member-role-modal')).toBeHidden();

    await expect(page.getByTestId(`member-role-badge-${customerEmail}`)).toHaveText('Member');
    await expect(page.getByTestId(`update-member-role-btn-${customerEmail}`)).toHaveText('Promote');
  });

  test('promote modal closes on cancel without changing role', async ({ page }) => {
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeVisible();
    await page.getByTestId('add-member-email-input').fill(customerEmail);
    await page.getByTestId('add-member-submit-btn').click();
    await expect(page.getByTestId('add-member-modal')).toBeHidden();
    await expect(page.getByTestId(`member-row-${customerEmail}`)).toBeVisible();

    await page.getByTestId(`update-member-role-btn-${customerEmail}`).click();
    await expect(page.getByTestId('update-member-role-modal')).toBeVisible();
    await page.getByTestId('update-member-role-modal').getByTestId('cancel-btn').click();
    await expect(page.getByTestId('update-member-role-modal')).toBeHidden();

    await expect(page.getByTestId(`member-role-badge-${customerEmail}`)).toHaveText('Member');
  });
});
