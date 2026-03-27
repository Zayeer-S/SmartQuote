import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_TICKET = {
  title: 'Smoke test ticket',
  description: 'Verifying ticket submission works E2E',
  deadline: '2099-12-31',
  usersAffected: '5',
};

const DASHBOARD_URL = '/customer';

const FIXTURES_DIR = path.join(__dirname, '../../fixtures');
const FIXTURE_PDF = path.join(FIXTURES_DIR, 'sample.pdf');
const FIXTURE_JPG = path.join(FIXTURES_DIR, 'sample.jpg');
const FIXTURE_PNG = path.join(FIXTURES_DIR, 'sample.png');
const FIXTURE_TXT = path.join(FIXTURES_DIR, 'sample.txt');

const ATTACHMENT_HAPPY_PATH_CASES = [
  { label: 'PDF', fixture: FIXTURE_PDF },
  { label: 'JPG', fixture: FIXTURE_JPG },
  { label: 'PNG', fixture: FIXTURE_PNG },
];

async function openNewTicketModal(page: Page): Promise<void> {
  await page.goto(DASHBOARD_URL);
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
  await page.getByTestId('open-new-ticket-modal-btn').click();
  await expect(page.getByTestId('new-ticket-modal')).toBeVisible();
  await expect(page.getByTestId('submit-ticket-form')).toBeVisible();
}

async function fillRequiredFields(page: Page): Promise<void> {
  await page.getByTestId('field-title').fill(VALID_TICKET.title);
  await page.getByTestId('field-description').fill(VALID_TICKET.description);
  await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
  await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
}

test.describe('Ticket submission', () => {
  test.beforeEach(async ({ page }) => {
    await openNewTicketModal(page);
  });

  test('valid submission succeeds and shows success state in modal', async ({ page }) => {
    await fillRequiredFields(page);
    await page.getByTestId('submit-ticket-btn').click();

    await expect(page.getByTestId('ticket-submit-success')).toBeVisible();
  });

  for (const { label, fixture } of ATTACHMENT_HAPPY_PATH_CASES) {
    test(`valid submission with a ${label} attachment succeeds`, async ({ page }) => {
      await fillRequiredFields(page);

      await page.getByTestId('field-attachments').setInputFiles(fixture);
      await expect(page.getByTestId('attachment-count')).toBeVisible();

      await page.getByTestId('submit-ticket-btn').click();
      await expect(page.getByTestId('ticket-submit-success')).toBeVisible();
    });
  }

  test('empty title fails validation', async ({ page }) => {
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
    await page.getByTestId('submit-ticket-btn').click();

    const errorEl = page.getByTestId('submit-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('Title is required');
  });

  test('empty description fails validation', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
    await page.getByTestId('submit-ticket-btn').click();

    const errorEl = page.getByTestId('submit-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('Description is required');
  });

  test('past deadline fails validation', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill('2000-01-01');
    await page.getByTestId('field-users-impacted').fill(VALID_TICKET.usersAffected);
    await page.getByTestId('submit-ticket-btn').click();

    const errorEl = page.getByTestId('submit-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('future');
  });

  test('negative users affected fails validation', async ({ page }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    await page.getByTestId('field-users-impacted').fill('-69');
    await page.getByTestId('submit-ticket-btn').click();

    const errorEl = page.getByTestId('submit-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('whole number');
  });

  test('non-numeric input in users affected is blocked and submit shows validation error', async ({
    page,
  }) => {
    await page.getByTestId('field-title').fill(VALID_TICKET.title);
    await page.getByTestId('field-description').fill(VALID_TICKET.description);
    await page.getByTestId('field-deadline').fill(VALID_TICKET.deadline);
    // 'e' is swallowed by the handleChange guard, leaving the field empty
    await page.getByTestId('field-users-impacted').fill('e');
    await page.getByTestId('submit-ticket-btn').click();

    const errorEl = page.getByTestId('submit-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('whole number');
  });

  test('disallowed file type shows validation error before submission', async ({ page }) => {
    await fillRequiredFields(page);

    await page.getByTestId('field-attachments').setInputFiles(FIXTURE_TXT);
    await page.getByTestId('submit-ticket-btn').click();

    const errorEl = page.getByTestId('submit-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('not an allowed file type');
  });
});
