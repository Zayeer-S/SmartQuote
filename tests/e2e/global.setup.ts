import { execSync } from 'child_process';

export default function globalSetup() {
  execSync('cross-env NODE_ENV=test npm run db:reset', { stdio: 'inherit' });
}
