import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';

// eslint-disable-next-line @typescript-eslint/require-await
setup('reset database', async () => {
  execSync('npm run db:migrate && npm run db:seed', { stdio: 'inherit' });
});
