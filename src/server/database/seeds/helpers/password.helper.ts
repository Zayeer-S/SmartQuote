import bcrypt from 'bcryptjs';

const DEV_PASSWORD = 'password';

export async function hashPassword(password: string, saltRounds: number): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

export async function getDevPasswordHash(saltRounds: number): Promise<string> {
  return hashPassword(DEV_PASSWORD, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
