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
  await expect(page.getByTestId('admin-ticket-detail')).toBeVisible();
});

test('admin can see the comment type selector', async ({ page }) => {
  await expect(page.getByTestId('comment-type-select')).toBeVisible();
});

test('admin can post an external comment', async ({ page }) => {
  await page.getByTestId('comment-type-select').selectOption('External');
  await page.getByTestId('comment-text-input').fill(COMMENT_CONTENT.EXTERNAL);
  await page.getByTestId('add-comment-btn').click();

  await expect(page.getByTestId('comment-text-input')).toHaveValue('');
  await expect(page.getByTestId('comments-list')).toContainText(COMMENT_CONTENT.EXTERNAL);
});

test('admin can post an internal comment', async ({ page }) => {
  await page.getByTestId('comment-type-select').selectOption('Internal');
  await page.getByTestId('comment-text-input').fill(COMMENT_CONTENT.INTERNAL);
  await page.getByTestId('add-comment-btn').click();

  await expect(page.getByTestId('comment-text-input')).toHaveValue('');
  await expect(page.getByTestId('comments-list')).toContainText(COMMENT_CONTENT.INTERNAL);
});
