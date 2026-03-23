import { PasswordService } from '../../../src/server/services/auth/password.service';
import type { PasswordConfig } from '../../../src/server/services/auth/auth.config.types';
import { beforeEach, describe, expect, it } from 'vitest';

const baseConfig: PasswordConfig = {
  saltRounds: 4,
  minLength: 8,
  maxLength: 128,
  requireSpecialChar: true,
  requireNumber: true,
  requireUppercase: true,
  requireLowercase: true,
  generatedPasswordLength: 16,
};

describe(`PasswordService`, () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService(baseConfig);
  });

  describe('hash', () => {
    it('returns a bcrypt hash distinct from plaintext', async () => {
      const hash = await service.hash('Plaintext1!');
      expect(hash).not.toBe('Plaintext1!');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('produces a different hash on each call for the same input', async () => {
      const [a, b] = await Promise.all([service.hash('Plaintext1!'), service.hash('Plaintext1!')]);
      expect(a).not.toBe(b);
    });
  });

  describe('verify', () => {
    it('returns true for the correct password', async () => {
      const hash = await service.hash('Correct1!');
      expect(await service.verify('Correct1!', hash)).toBe(true);
    });

    it('returns false for the wrong password', async () => {
      const hash = await service.hash('Correct1!');
      expect(await service.verify('Wrong999!', hash)).toBe(false);
    });

    it('returns false for an empty string against a real hash', async () => {
      const hash = await service.hash('Correct1!');
      expect(await service.verify('', hash)).toBe(false);
    });
  });

  describe('validate', () => {
    it('returns true for a password meeting all requirements', () => {
      const result = service.validate('Valid123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when password is below minLength', () => {
      const result = service.validate('V1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('at least 8')])
      );
    });

    it('fails when password exceeds maxLength', () => {
      const long = 'A'.repeat(200);
      const result = service.validate(long + '1!a');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('128')]));
    });

    it('fails when an uppercase character is missing', () => {
      const result = service.validate('noupperc1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('uppercase')]));
    });

    it('fails when lowercase is missing', () => {
      const result = service.validate('NOLOWER1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('lowercase')]));
    });

    it('fails when number is missing', () => {
      const result = service.validate('NoNumbersHere!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('number')]));
    });

    it('fails when special character is missing', () => {
      const result = service.validate('NoSpecial1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('special')]));
    });

    it('accumulates multiple errors when multiple rules fail', () => {
      const result = service.validate('short');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('respects disabled rules when config flags are false', () => {
      const relaxedService = new PasswordService({
        ...baseConfig,
        requireSpecialChar: false,
        requireNumber: false,
        requireUppercase: false,
        requireLowercase: false,
      });
      const result = relaxedService.validate('alllowercase');
      expect(result.isValid).toBe(true);
    });
  });

  describe('generate', () => {
    it('generates a password of the configured length', () => {
      const password = service.generate();
      expect(password).toHaveLength(baseConfig.generatedPasswordLength);
    });

    it('generates a password that satisfies its own validate rules', () => {
      const password = service.generate();
      const result = service.validate(password);
      expect(result.isValid).toBe(true);
    });

    it('generates different passwords on each call', () => {
      const passwords = new Set(Array.from({ length: 10 }, () => service.generate()));
      expect(passwords.size).toBeGreaterThan(1);
    });
  });
});
