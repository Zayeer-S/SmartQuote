import { test as setup, request } from '@playwright/test';
import fs from 'fs';
import { login } from '../utils/login.utils';
import { USERS } from '../../constants/test.user.credentials';
import { SESSION_PATHS, SMOKE_DATA_PATHS } from '../constants/e2e.paths';
import type { LoginResponse } from '../../../src/shared/contracts/auth-contracts';
import type { TicketResponse } from '../../../src/shared/contracts/ticket-contracts';
import { TICKET_TYPES, TICKET_SEVERITIES, BUSINESS_IMPACTS } from '../../../src/shared/constants';

const API_BASE = 'http://localhost:3000';

// Ticket is created under CUSTOMER1 so it belongs to the customer's org.
// The admin session is separate and used only for the admin comment tests.
setup('create comment smoke ticket and authenticate admin', async ({ page }) => {
  // --- Create ticket as CUSTOMER1 via API ---
  const ctx = await request.newContext({ baseURL: API_BASE });

  const loginRes = await ctx.post('api/auth/login', {
    data: { email: USERS.CUSTOMER1_DIFF_ORG.EMAIL, password: USERS.CUSTOMER1_DIFF_ORG.PASSWORD },
  });
  const loginBody = (await loginRes.json()) as { data: LoginResponse };

  const customerToken = loginBody.data.token;

  const ticketRes = await ctx.post('api/tickets/', {
    headers: { Authorization: `Bearer ${customerToken}` },
    data: {
      title: 'Comment smoke test ticket',
      description: 'Created by admin.setup.ts for comment smoke tests',
      ticketType: TICKET_TYPES.SUPPORT,
      ticketSeverity: TICKET_SEVERITIES.LOW,
      businessImpact: BUSINESS_IMPACTS.MINOR,
      deadline: '2099-12-31T00:00:00.000Z',
      usersImpacted: 1,
    },
  });
  const ticketBody = (await ticketRes.json()) as { data: TicketResponse };
  const ticketId = ticketBody.data.id;

  fs.mkdirSync('.playwright', { recursive: true });
  fs.writeFileSync(SMOKE_DATA_PATHS.COMMENT_TICKET, JSON.stringify({ ticketId }));

  await ctx.dispose();

  await login(page, USERS.ADMIN.EMAIL, USERS.ADMIN.PASSWORD, /\/admin/, true);
  await page.context().storageState({ path: SESSION_PATHS.ADMIN });
});
