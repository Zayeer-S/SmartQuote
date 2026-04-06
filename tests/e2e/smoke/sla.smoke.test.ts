import { test, expect, type Page, type APIRequestContext, request } from '@playwright/test';
import { TICKET_SEVERITIES, BUSINESS_IMPACTS, TICKET_TYPES } from '../../../src/shared/constants';
import { USERS } from '../../constants/test.user.credentials';

const API_BASE = 'http://localhost:3000';
const SLA_PAGE_URL = '/admin/sla-policies';
const TICKETS_URL = '/admin';

async function getAdminToken(ctx: APIRequestContext): Promise<string> {
  const res = await ctx.post(`${API_BASE}/api/auth/login`, {
    data: { email: USERS.ADMIN.EMAIL, password: USERS.ADMIN.PASSWORD },
  });
  const body = (await res.json()) as { data: { token: string } };
  return body.data.token;
}

async function getOrg1Id(ctx: APIRequestContext, token: string): Promise<string> {
  const res = await ctx.get(`${API_BASE}/api/sla-policies/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await res.json()) as { data: { policies: { organizationId: string }[] } };
  return body.data.policies[0].organizationId;
}

async function createSlaPolicy(
  ctx: APIRequestContext,
  token: string,
  orgId: string,
  name: string
): Promise<number> {
  const res = await ctx.post(`${API_BASE}/api/sla-policies/`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name,
      organizationId: orgId,
      contract: {
        severityTargets: [
          { severity: TICKET_SEVERITIES.CRITICAL, responseTimeHours: 1, resolutionTimeHours: 4 },
          { severity: TICKET_SEVERITIES.HIGH, responseTimeHours: 4, resolutionTimeHours: 8 },
          { severity: TICKET_SEVERITIES.MEDIUM, responseTimeHours: 8, resolutionTimeHours: 24 },
          { severity: TICKET_SEVERITIES.LOW, responseTimeHours: 24, resolutionTimeHours: 72 },
        ],
      },
      effectiveFrom: new Date().toISOString(),
      effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  const body = (await res.json()) as { data: { id: number } };
  return body.data.id;
}

async function createPastDeadlineTicket(
  ctx: APIRequestContext,
  token: string,
  adminToken: string
): Promise<string> {
  const createRes = await ctx.post(`${API_BASE}/api/tickets/`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: 'SLA breach smoke test ticket',
      description: 'Ticket with a past deadline to test SLA breach indicator',
      ticketType: TICKET_TYPES.INCIDENT,
      ticketSeverity: TICKET_SEVERITIES.HIGH,
      businessImpact: BUSINESS_IMPACTS.MAJOR,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      usersImpacted: 10,
    },
  });
  const createBody = (await createRes.json()) as { data: { id: string } };
  const ticketId = createBody.data.id;

  await ctx.patch(`${API_BASE}/api/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { deadline: '2020-01-01T00:00:00.000Z' },
  });

  return ticketId;
}

async function openSlaPage(page: Page): Promise<void> {
  await page.goto(SLA_PAGE_URL);
  await expect(page.getByTestId('admin-sla-policies-page')).toBeVisible();
  await expect(page.getByTestId('sla-list-loading')).toBeHidden();
}

test.describe('SLA policy CRUD', () => {
  let ctx: APIRequestContext;
  let adminToken: string;
  let orgId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let createdPolicyId: number;

  test.beforeAll(async () => {
    ctx = await request.newContext({ baseURL: API_BASE });
    adminToken = await getAdminToken(ctx);
    orgId = await getOrg1Id(ctx, adminToken);
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test.beforeEach(async ({ page }) => {
    await openSlaPage(page);
  });

  test('SLA policies page loads with seeded policies in the table', async ({ page }) => {
    const table = page.getByTestId('sla-policies-table');
    await expect(table).toBeVisible();
    await expect(page.getByTestId('sla-empty-state')).toBeHidden();
    await expect(page.getByTestId('sla-list-error')).toBeHidden();

    const rows = page.locator('[data-testid^="sla-row-"]');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThanOrEqual(2);
  });

  test('seeded policy rows show org name not raw UUID in scope column', async ({ page }) => {
    const rows = page.locator('[data-testid^="sla-row-"]');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowId = (await row.getAttribute('data-testid'))?.replace('sla-row-', '') ?? '';
      const scopeCell = page.getByTestId(`sla-scope-${rowId}`);
      const text = await scopeCell.textContent();

      expect(text).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect((text ?? '').length).toBeGreaterThan(0);
    }
  });

  test('opening the create modal and submitting creates a new policy', async ({ page }) => {
    const initialCount = await page.locator('[data-testid^="sla-row-"]').count();

    await page.getByTestId('add-sla-policy-btn').click();
    await expect(page.locator('.sla-modal')).toBeVisible();

    await page.getByTestId('sla-form-name').fill('E2E Smoke SLA Policy');

    const scopeSelect = page.getByTestId('sla-form-scope-select');
    await expect(scopeSelect.locator('option:not([value=""])')).not.toHaveCount(0);
    await scopeSelect.selectOption(orgId);

    const now = new Date();
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const toLocalDateTimeValue = (d: Date): string => d.toISOString().slice(0, 16);

    await page.getByTestId('sla-form-effective-from').fill(toLocalDateTimeValue(now));
    await page.getByTestId('sla-form-effective-to').fill(toLocalDateTimeValue(future));

    await page.getByTestId('sla-form-response-critical').fill('1');
    await page.getByTestId('sla-form-resolution-critical').fill('4');
    await page.getByTestId('sla-form-response-high').fill('4');
    await page.getByTestId('sla-form-resolution-high').fill('8');
    await page.getByTestId('sla-form-response-medium').fill('8');
    await page.getByTestId('sla-form-resolution-medium').fill('24');
    await page.getByTestId('sla-form-response-low').fill('24');
    await page.getByTestId('sla-form-resolution-low').fill('72');

    await page.getByTestId('sla-form-submit').click();

    await expect(page.locator('.sla-modal')).toBeHidden();
    await expect(page.locator('[data-testid^="sla-row-"]')).toHaveCount(initialCount + 1);

    const rows = page.locator('[data-testid^="sla-row-"]');
    const lastRowId =
      (await rows.last().getAttribute('data-testid'))?.replace('sla-row-', '') ?? '';
    createdPolicyId = Number(lastRowId);
  });

  test('client-side validation blocks submit when resolution < response for a severity', async ({
    page,
  }) => {
    await page.getByTestId('add-sla-policy-btn').click();
    await expect(page.locator('.sla-modal')).toBeVisible();

    await page.getByTestId('sla-form-name').fill('Invalid SLA');
    const scopeSelect = page.getByTestId('sla-form-scope-select');
    await expect(scopeSelect.locator('option:not([value=""])')).not.toHaveCount(0);
    await scopeSelect.selectOption(orgId);

    const now = new Date();
    const future = new Date(Date.now() + 1000 * 60 * 60);
    const toLocalDateTimeValue = (d: Date): string => d.toISOString().slice(0, 16);
    await page.getByTestId('sla-form-effective-from').fill(toLocalDateTimeValue(now));
    await page.getByTestId('sla-form-effective-to').fill(toLocalDateTimeValue(future));

    await page.getByTestId('sla-form-response-critical').fill('8');
    await page.getByTestId('sla-form-resolution-critical').fill('1');
    await page.getByTestId('sla-form-response-high').fill('4');
    await page.getByTestId('sla-form-resolution-high').fill('8');
    await page.getByTestId('sla-form-response-medium').fill('8');
    await page.getByTestId('sla-form-resolution-medium').fill('24');
    await page.getByTestId('sla-form-response-low').fill('24');
    await page.getByTestId('sla-form-resolution-low').fill('72');

    await page.getByTestId('sla-form-submit').click();

    await expect(page.getByTestId('sla-form-error')).toBeVisible();
    await expect(page.locator('.sla-modal')).toBeVisible();

    await page.getByTestId('sla-form-cancel').click();
  });

  test('editing a policy updates the name in the table', async ({ page }) => {
    const firstEditBtn = page.locator('[data-testid^="sla-edit-"]').first();
    const editTestId = await firstEditBtn.getAttribute('data-testid');
    const editId = editTestId?.replace('sla-edit-', '') ?? '';

    await firstEditBtn.click();
    await expect(page.locator('.sla-modal')).toBeVisible();

    await page.getByTestId('sla-form-name').fill('Renamed by E2E test');
    await page.getByTestId('sla-form-submit').click();

    await expect(page.locator('.sla-modal')).toBeHidden();
    await expect(page.getByTestId(`sla-name-${editId}`)).toContainText('Renamed by E2E test');
  });

  test('deactivating a policy shows the confirm flow and removes the deactivate button', async ({
    page,
  }) => {
    const policyId = await createSlaPolicy(ctx, adminToken, orgId, 'E2E Deactivate Test Policy');

    await openSlaPage(page);

    const deleteBtn = page.getByTestId(`sla-delete-${String(policyId)}`);
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    await expect(page.getByTestId(`sla-confirm-delete-${String(policyId)}`)).toBeVisible();
    await expect(page.getByTestId(`sla-cancel-delete-${String(policyId)}`)).toBeVisible();

    await page.getByTestId(`sla-confirm-delete-${String(policyId)}`).click();

    await expect(page.getByTestId(`sla-delete-${String(policyId)}`)).toBeHidden();
  });
});

test.describe('SLA breach indicator on ticket list and detail', () => {
  let ctx: APIRequestContext;
  let adminToken: string;
  let breachedTicketId: string;

  test.beforeAll(async () => {
    ctx = await request.newContext({ baseURL: API_BASE });
    adminToken = await getAdminToken(ctx);

    const loginRes = await ctx.post(`${API_BASE}/api/auth/login`, {
      data: { email: USERS.CUSTOMER1_DIFF_ORG.EMAIL, password: USERS.CUSTOMER1_DIFF_ORG.PASSWORD },
    });
    const loginBody = (await loginRes.json()) as { data: { token: string } };
    const customerToken = loginBody.data.token;

    breachedTicketId = await createPastDeadlineTicket(ctx, customerToken, adminToken);
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('breached ticket shows SLA Breached badge on the ticket list', async ({ page }) => {
    await page.goto(TICKETS_URL);
    // admin-tickets-list is rendered by BaseTicketList with testIdPrefix="admin-tickets"
    await expect(page.getByTestId('admin-tickets-list')).toBeVisible();

    const card = page.getByTestId(`admin-ticket-card-${breachedTicketId}`);
    await expect(card).toBeVisible();

    const badge = card.getByTestId('ticket-sla-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('SLA Breached');
  });

  test('non-breached ticket shows SLA OK badge on the ticket list', async ({ page }) => {
    await page.goto(TICKETS_URL);
    await expect(page.getByTestId('admin-tickets-list')).toBeVisible();

    const okBadges = page.locator('[data-testid="ticket-sla-badge"]:has-text("SLA OK")');
    await expect(okBadges.first()).toBeVisible();
  });

  test('breached ticket detail page shows SLA section with breach status', async ({ page }) => {
    await page.goto(`/admin/tickets/${breachedTicketId}`);
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();
    // SlaStatus is rendered inside the details tab after ticketData loads --
    // wait for TicketDetailCard to confirm the tab content is ready
    await expect(page.getByTestId('ticket-detail')).toBeVisible();

    await expect(page.getByTestId('sla-section')).toBeVisible();
    await expect(page.getByTestId('sla-policy-name')).toBeVisible();

    const breachBadge = page.getByTestId('sla-breach-badge');
    await expect(breachBadge).toBeVisible();
    await expect(breachBadge).toContainText('Deadline Breached');

    await expect(page.getByTestId('ticket-sla-badge-header')).toContainText('SLA Breached');
  });

  test('SLA targets table is visible on detail page with all 4 severities', async ({ page }) => {
    await page.goto(`/admin/tickets/${breachedTicketId}`);
    await expect(page.getByTestId('ticket-detail')).toBeVisible();

    const table = page.getByTestId('sla-targets-table');
    await expect(table).toBeVisible();

    await expect(page.getByTestId('sla-target-row-critical')).toBeVisible();
    await expect(page.getByTestId('sla-target-row-high')).toBeVisible();
    await expect(page.getByTestId('sla-target-row-medium')).toBeVisible();
    await expect(page.getByTestId('sla-target-row-low')).toBeVisible();
  });

  test('ticket with no SLA policy shows no SLA section on detail page', async ({ page }) => {
    const noOrgCtx = await request.newContext({ baseURL: API_BASE });
    const loginRes = await noOrgCtx.post(`${API_BASE}/api/auth/login`, {
      data: { email: USERS.CUSTOMER4_NO_ORG.EMAIL, password: USERS.CUSTOMER4_NO_ORG.PASSWORD },
    });
    const loginBody = (await loginRes.json()) as { data: { token: string } };
    const noOrgToken = loginBody.data.token;

    const ticketRes = await noOrgCtx.post(`${API_BASE}/api/tickets/`, {
      headers: { Authorization: `Bearer ${noOrgToken}` },
      data: {
        title: 'No SLA ticket for smoke test',
        description: 'Customer with no org -- verifying no SLA section appears on detail page.',
        ticketType: TICKET_TYPES.SUPPORT,
        ticketSeverity: TICKET_SEVERITIES.LOW,
        businessImpact: BUSINESS_IMPACTS.MINOR,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usersImpacted: 1,
      },
    });
    const ticketBody = (await ticketRes.json()) as { data: { id: string } };
    const noSlaTicketId = ticketBody.data.id;
    await noOrgCtx.dispose();

    await page.goto(`/admin/tickets/${noSlaTicketId}`);
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();
    // Wait for ticket content to load before asserting absence of sla-section
    await expect(page.getByTestId('ticket-detail')).toBeVisible();
    await expect(page.getByTestId('sla-section')).toBeHidden();
  });
});
