import { test, expect } from '@playwright/test';

const VALID_TICKET = {
  title: 'Smoke test ticket',
  description: 'Verifying ticket submission works E2E',
  deadline: '2099-12-31',
  usersAffected: '5',
};

const NEW_TICKET_URL = '/customer/tickets/new';
const TICKETS_URL = '/customer/tickets';

test.describe('Ticket submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(NEW_TICKET_URL);
    await expect(page.getByTestId('new-ticket-page')).toBeVisible();
  });

  test('valid submission succeeds and redirects to tickets list', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page).toHaveURL(new RegExp(TICKETS_URL));
  });

  test('empty title fails validation', async ({ page }) => {
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page.getByTestId('submit-error')).toBeVisible();
  });

  test('empty description fails validation', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page.getByTestId('submit-error')).toBeVisible();
  });

  test('past deadline fails validation', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill('2000-01-01');
    await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page.getByTestId('submit-error')).toBeVisible();
  });

  test('negative users affected fails validation', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill('-69');
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page.getByTestId('submit-error')).toBeVisible();
  });

  test('scientific notation in users affected fails validation', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill('e');
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page.getByTestId('submit-error')).toBeVisible();
  });
});
