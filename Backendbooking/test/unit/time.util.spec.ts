import { describe, it, expect } from 'vitest';
import * as argon2 from 'argon2';
import {
  calculateEndTime,
  generateBookingCode,
  generateTicketNumber,
  getJakartaDateString,
} from '../../src/common/utils/time.util.js';

describe('Time & Password Security Utilities Unit Tests', () => {
  describe('1. Password Hashing (Argon2id)', () => {
    it('should hash password securely and verify matching password', async () => {
      const password = 'SuperSecretPassword123!';
      const hash = await argon2.hash(password);
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$argon2')).toBe(true);

      const isMatch = await argon2.verify(hash, password);
      expect(isMatch).toBe(true);

      const isMismatch = await argon2.verify(hash, 'WrongPassword');
      expect(isMismatch).toBe(false);
    });
  });

  describe('2. Time Calculation & Operating Limits', () => {
    it('should calculate end time correctly for standard durations', () => {
      expect(calculateEndTime('09:00', 3)).toBe('12:00');
      expect(calculateEndTime('13:30', 2)).toBe('15:30');
      expect(calculateEndTime('08:15', 1)).toBe('09:15');
      expect(calculateEndTime('21:00', 3)).toBe('24:00');
    });

    it('should reject reservations crossing daily operating limit (> 24:00)', () => {
      expect(() => calculateEndTime('22:00', 3)).toThrow('melewati batas operasional');
      expect(() => calculateEndTime('23:30', 1)).toThrow('melewati batas operasional');
    });

    it('should resolve Jakarta business date accurately', () => {
      expect(getJakartaDateString(new Date('2026-09-30T18:00:00.000Z'))).toBe('2026-10-01');
    });

    it('should generate valid format booking codes', () => {
      const code = generateBookingCode('2026-09-30');
      expect(code.startsWith('BOOK-20260930-')).toBe(true);
      expect(code.length).toBeGreaterThan(15);
    });

    it('should generate valid format ticket numbers', () => {
      const ticket = generateTicketNumber('2026-09-30', 12);
      expect(ticket).toBe('TICKET-MOKLET-20260930-0012');
    });
  });
});
