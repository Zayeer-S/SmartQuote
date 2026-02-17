import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { PasswordConfig } from './auth.config.types';

export class PasswordService {
  private readonly config: PasswordConfig;

  constructor(config: PasswordConfig) {
    this.config = config;
  }

  /**
   * Hash a plaintext password using bcrypt
   *
   * @param plaintext Plain text password
   * @returns Hashed password
   */
  async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, this.config.saltRounds);
  }

  /**
   * Verify a plaintext password against a hash
   *
   * @param plaintext Plain text password to verify
   * @param hash Hashed password to compare against
   * @returns True if password matches, false otherwise
   */
  async verify(plaintext: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plaintext, hash);
  }

  /**
   * Validate password strength against configured rules
   *
   * @param password Password to validate
   * @returns Validation result with success flag and error messages
   */
  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.config.minLength)
      errors.push(`Password must be at least ${String(this.config.minLength)} characters`);

    if (password.length > this.config.maxLength)
      errors.push(`Password must be at least ${String(this.config.maxLength)} characters`);

    if (this.config.requireUppercase && !/[A-Z]/.test(password))
      errors.push(`Password must have at least one uppercase character`);

    if (this.config.requireLowercase && !/[a-z]/.test(password))
      errors.push(`Password must have at least one uppercase character`);

    if (this.config.requireNumber && !/[0-9]/.test(password))
      errors.push(`Password must have at least one number`);

    if (this.config.requireSpecialChar && !/[^A-Za-z0-9]/.test(password))
      errors.push(`Password must contain at least one special cahracter`);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  generate(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';

    if (this.config.requireUppercase) password += uppercase[crypto.randomInt(0, uppercase.length)];
    if (this.config.requireLowercase) password += lowercase[crypto.randomInt(0, lowercase.length)];
    if (this.config.requireNumber) password += numbers[crypto.randomInt(0, numbers.length)];
    if (this.config.requireSpecialChar) password += special[crypto.randomInt(0, special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    const remaining = this.config.generatedPasswordLength - password.length;
    for (let i = 0; i < remaining; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    return password
      .split('')
      .sort(() => crypto.randomInt(-1, 2))
      .join('');
  }
}
