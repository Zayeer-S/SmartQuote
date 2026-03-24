import { test, expect } from '@playwright/test';
import {
  getCommentSmokeTicketId,
  COMMENT_SMOKE_URLS,
  COMMENT_CONTENT,
} from '../constants/comment.smoke.data';

let ticketId: string;

test.beforeAll(() => {
  ticketId = getCommentSmokeTicketId();
});

test.beforeEach(async ({ page }) => {
  await page.goto(COMMENT_SMOKE_URLS.customer(ticketId));
  await expect(page.getByTestId('ticket-detail')).toBeVisible();
});

test('customer can see the comment thread', async ({ page }) => {
  await expect(page.getByTestId('comment-thread')).toBeVisible();
});

test('customer can post an external comment', async ({ page }) => {
  await page.getByTestId('comment-text-input').fill(COMMENT_CONTENT.EXTERNAL);
  await page.getByTestId('add-comment-btn').click();

  await expect(page.getByTestId('comment-text-input')).toHaveValue('');
  await expect(page.getByTestId('comments-list')).toContainText(COMMENT_CONTENT.EXTERNAL);
});

test('customer cannot see the comment type selector', async ({ page }) => {
  await expect(page.getByTestId('comment-type-select')).not.toBeAttached();
});

test('customer cannot see internal comment posted by admin', async ({ page }) => {
  // Wait for the thread to finish loading before asserting absence
  await expect(page.getByTestId('comments-loading')).not.toBeVisible();
  await expect(page.getByTestId('comment-thread')).not.toContainText(COMMENT_CONTENT.INTERNAL);
});
