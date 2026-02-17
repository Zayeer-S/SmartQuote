import bcrypt from 'bcrypt';
import { backEnv } from '../../../config';

const DEV_PASSWORD = 'password';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, backEnv.BCRYPT_SALT_ROUNDS);
}

export async function getDevPasswordHash(): Promise<string> {
  return hashPassword(DEV_PASSWORD);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
