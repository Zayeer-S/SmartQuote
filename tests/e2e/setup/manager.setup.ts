import { test as setup } from '@playwright/test';
import { login } from '../utils/login.utils';
import { USERS } from '../../constants/test.user.credentials';
import { SESSION_PATHS } from '../constants/e2e.paths';

const { EMAIL, PASSWORD } = USERS.MANAGER;

setup('authenticate as manager', async ({ page }) => {
  await login(page, EMAIL, PASSWORD, /\/admin/, true);
  await page.context().storageState({ path: SESSION_PATHS.MANAGER });
});
