import { test as setup } from '@playwright/test';
import { login } from '../utils/login.utils';
import { USERS } from '../../constants/test.user.credentials';
import { SESSION_PATHS } from '../constants/e2e.paths';

const { EMAIL, PASSWORD } = USERS.CUSTOMER1_DIFF_ORG;

setup('authenticate as customer', async ({ page }) => {
  await login(page, EMAIL, PASSWORD, /\/customer/, true);

  await page.context().storageState({ path: SESSION_PATHS.CUSTOMER });
});
