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
  await page.goto(COMMENT_SMOKE_URLS.admin(ticketId));
  await expect(page.getByTestId('admin-ticket-detail-page')).toBeVisible();
  await expect(page.getByTestId('comment-thread')).toBeVisible();
});

test('admin can see the comment channel tabs', async ({ page }) => {
  await expect(page.getByTestId('comment-thread-tabs')).toBeVisible();
  await expect(page.getByTestId('tab-nav-btn-customer')).toBeVisible();
  await expect(page.getByTestId('tab-nav-btn-internal')).toBeVisible();
});

test('admin can post an external comment', async ({ page }) => {
  await page.getByTestId('comment-text-input').fill(COMMENT_CONTENT.EXTERNAL);
  await page.getByTestId('add-comment-btn').click();

  await expect(page.getByTestId('comment-text-input')).toHaveValue('');
  await expect(page.getByTestId('comments-list')).toContainText(COMMENT_CONTENT.EXTERNAL);
});

test('admin can post an internal comment', async ({ page }) => {
  await page.getByTestId('tab-nav-btn-internal').click();
  await page.getByTestId('comment-text-input').fill(COMMENT_CONTENT.INTERNAL);
  await page.getByTestId('add-comment-btn').click();

  await expect(page.getByTestId('comment-text-input')).toHaveValue('');
  await expect(page.getByTestId('comments-list')).toContainText(COMMENT_CONTENT.INTERNAL);
});
