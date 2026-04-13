import { test, expect, request } from '@playwright/test';
import { USERS } from '../../constants/test.user.credentials';
import type { LoginResponse } from '../../../src/shared/contracts/auth-contracts';
import type { TicketResponse } from '../../../src/shared/contracts/ticket-contracts';
import type { QuoteResponse } from '../../../src/shared/contracts/quote-contracts';
import { TICKET_TYPES, TICKET_SEVERITIES, BUSINESS_IMPACTS } from '../../../src/shared/constants';
import { SESSION_PATHS } from '../constants/e2e.paths';

const API_BASE = 'http://localhost:3000';

interface Tokens {
  customer: string;
  agent: string;
  manager: string;
}

async function getTokens(): Promise<Tokens> {
  const ctx = await request.newContext({ baseURL: API_BASE });

  const loginAs = async (email: string, password: string): Promise<string> => {
    const res = await ctx.post('api/auth/login', { data: { email, password } });
    const body = (await res.json()) as { data: LoginResponse };
    return body.data.token;
  };

  const [customer, agent, manager] = await Promise.all([
    loginAs(USERS.CUSTOMER1_DIFF_ORG.EMAIL, USERS.CUSTOMER1_DIFF_ORG.PASSWORD),
    loginAs(USERS.AGENT.EMAIL, USERS.AGENT.PASSWORD),
    loginAs(USERS.MANAGER.EMAIL, USERS.MANAGER.PASSWORD),
  ]);

  await ctx.dispose();
  return { customer, agent, manager };
}

async function createTicket(): Promise<string> {
  const ctx = await request.newContext({ baseURL: API_BASE });

  // Ticket must belong to customer1's org -- create as customer1
  const customerCtx = await request.newContext({ baseURL: API_BASE });
  const loginRes = await customerCtx.post('api/auth/login', {
    data: { email: USERS.CUSTOMER1_DIFF_ORG.EMAIL, password: USERS.CUSTOMER1_DIFF_ORG.PASSWORD },
  });
  const loginBody = (await loginRes.json()) as { data: LoginResponse };
  const customerToken = loginBody.data.token;

  const res = await customerCtx.post('api/tickets/', {
    headers: { Authorization: `Bearer ${customerToken}` },
    data: {
      title: `Quote approval flow ${String(Date.now())}`,
      description: 'Created by quote.approval.flow.test.ts',
      ticketType: TICKET_TYPES.SUPPORT,
      ticketSeverity: TICKET_SEVERITIES.LOW,
      businessImpact: BUSINESS_IMPACTS.MINOR,
      deadline: '2099-12-31T00:00:00.000Z',
      usersImpacted: 1,
    },
  });
  const body = (await res.json()) as { data: TicketResponse };

  await ctx.dispose();
  await customerCtx.dispose();
  return body.data.id;
}

async function createManualQuote(ticketId: string, agentToken: string): Promise<string> {
  const ctx = await request.newContext({ baseURL: API_BASE });
  const res = await ctx.post(`api/tickets/${ticketId}/quotes/manual`, {
    headers: { Authorization: `Bearer ${agentToken}` },
    data: {
      estimatedHoursMinimum: 4,
      estimatedHoursMaximum: 8,
      hourlyRate: 100,
      fixedCost: 0,
      quoteEffortLevel: 'Low',
      quoteConfidenceLevel: 'Medium',
    },
  });
  const body = (await res.json()) as { data: QuoteResponse };
  await ctx.dispose();
  return body.data.id;
}

async function submitQuote(ticketId: string, quoteId: string, agentToken: string): Promise<void> {
  const ctx = await request.newContext({ baseURL: API_BASE });
  await ctx.post(`api/tickets/${ticketId}/quotes/${quoteId}/submit`, {
    headers: { Authorization: `Bearer ${agentToken}` },
  });
  await ctx.dispose();
}

async function managerApproveQuote(
  ticketId: string,
  quoteId: string,
  managerToken: string
): Promise<void> {
  const ctx = await request.newContext({ baseURL: API_BASE });
  await ctx.post(`api/tickets/${ticketId}/quotes/${quoteId}/manager-approve`, {
    headers: { Authorization: `Bearer ${managerToken}` },
    data: { comment: null },
  });
  await ctx.dispose();
}

function adminTicketUrl(ticketId: string): string {
  return `/admin/tickets/${ticketId}`;
}

function customerTicketUrl(ticketId: string): string {
  return `/customer/tickets/${ticketId}`;
}

test.describe('Quote approval flow: agent submits', () => {
  test.use({ storageState: SESSION_PATHS.AGENT });

  test('agent sees submit button on an unsubmitted quote and submits successfully', async ({
    page,
  }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    await createManualQuote(ticketId, tokens.agent);

    await page.goto(adminTicketUrl(ticketId));
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-loading')).toBeHidden();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await expect(page.getByTestId('submit-approval-btn')).toBeVisible();
    await page.getByTestId('submit-approval-btn').click();

    await expect(page.getByTestId('submit-approval-btn')).toBeHidden();
  });

  test('agent does not see submit button on an already-submitted quote', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);

    await page.goto(adminTicketUrl(ticketId));
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await expect(page.getByTestId('submit-approval-btn')).toBeHidden();
  });
});

test.describe('Quote approval flow: manager approves', () => {
  test.use({ storageState: SESSION_PATHS.MANAGER });

  test('manager sees approve and reject buttons on a submitted quote', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);

    await page.goto(adminTicketUrl(ticketId));
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await expect(page.getByTestId('manager-approve-quote-btn')).toBeVisible();
    await expect(page.getByTestId('toggle-reject-quote-btn')).toBeVisible();
  });

  test('manager approve flow: approval section disappears after approving', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);

    await page.goto(adminTicketUrl(ticketId));
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await page.getByTestId('manager-approve-quote-btn').click();

    await expect(page.getByTestId('manager-approve-quote-btn')).toBeHidden();
    await expect(page.getByTestId('toggle-reject-quote-btn')).toBeHidden();
  });

  test('manager reject flow: requires comment, rejection hides approval section', async ({
    page,
  }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);

    await page.goto(adminTicketUrl(ticketId));
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await page.getByTestId('toggle-reject-quote-btn').click();
    await expect(page.getByTestId('reject-quote-form')).toBeVisible();

    await expect(page.getByTestId('reject-quote-submit-btn')).toBeDisabled();

    await page.getByTestId('rq-notes').fill('Cost estimate is too high');
    await expect(page.getByTestId('reject-quote-submit-btn')).toBeEnabled();
    await page.getByTestId('reject-quote-submit-btn').click();

    await expect(page.getByTestId('reject-quote-form')).toBeHidden();
    await expect(page.getByTestId('toggle-reject-quote-btn')).toBeHidden();
  });

  test('manager does not see approval buttons on a non-submitted quote', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    await createManualQuote(ticketId, tokens.agent);

    await page.goto(adminTicketUrl(ticketId));
    await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await expect(page.getByTestId('manager-approve-quote-btn')).toBeHidden();
    await expect(page.getByTestId('toggle-reject-quote-btn')).toBeHidden();
  });
});

test.describe('Quote approval flow: customer accepts', () => {
  test.use({ storageState: SESSION_PATHS.CUSTOMER });

  test('customer sees accept and reject buttons after manager approval', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);
    await managerApproveQuote(ticketId, quoteId, tokens.manager);

    await page.goto(customerTicketUrl(ticketId));
    await expect(page.getByTestId('ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await expect(page.getByTestId('approve-btn')).toBeVisible();
    await expect(page.getByTestId('open-reject-btn')).toBeVisible();
  });

  test('customer accept flow: success message shown after accepting', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);
    await managerApproveQuote(ticketId, quoteId, tokens.manager);

    await page.goto(customerTicketUrl(ticketId));
    await expect(page.getByTestId('ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await page.getByTestId('approve-btn').click();

    await expect(page.getByTestId('approve-success')).toBeVisible();
    await expect(page.getByTestId('approve-btn')).toBeHidden();
  });

  test('customer reject flow: requires comment, success message shown after rejecting', async ({
    page,
  }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);
    await managerApproveQuote(ticketId, quoteId, tokens.manager);

    await page.goto(customerTicketUrl(ticketId));
    await expect(page.getByTestId('ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await page.getByTestId('open-reject-btn').click();
    await expect(page.getByTestId('reject-form')).toBeVisible();

    // Confirm button disabled without comment
    await expect(page.getByTestId('confirm-reject-btn')).toBeDisabled();

    await page.getByTestId('reject-comment-input').fill('Too expensive for our budget');
    await expect(page.getByTestId('confirm-reject-btn')).toBeEnabled();
    await page.getByTestId('confirm-reject-btn').click();

    await expect(page.getByTestId('reject-success')).toBeVisible();
    await expect(page.getByTestId('reject-form')).toBeHidden();
  });

  test('customer does not see accept/reject buttons before manager approval', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);

    await page.goto(customerTicketUrl(ticketId));
    await expect(page.getByTestId('ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await expect(page.getByTestId('approve-btn')).toBeHidden();
    await expect(page.getByTestId('open-reject-btn')).toBeHidden();
  });

  test('customer cancel reject form: form hides and buttons reappear', async ({ page }) => {
    const tokens = await getTokens();
    const ticketId = await createTicket();
    const quoteId = await createManualQuote(ticketId, tokens.agent);
    await submitQuote(ticketId, quoteId, tokens.agent);
    await managerApproveQuote(ticketId, quoteId, tokens.manager);

    await page.goto(customerTicketUrl(ticketId));
    await expect(page.getByTestId('ticket-detail-page')).toBeVisible();

    await page.getByRole('tab', { name: 'Quote', exact: true }).click();
    await expect(page.getByTestId('quote-panel')).toBeVisible();

    await page.getByTestId('open-reject-btn').click();
    await expect(page.getByTestId('reject-form')).toBeVisible();

    await page.getByTestId('cancel-reject-btn').click();
    await expect(page.getByTestId('reject-form')).toBeHidden();
    await expect(page.getByTestId('open-reject-btn')).toBeVisible();
    await expect(page.getByTestId('approve-btn')).toBeVisible();
  });
});
