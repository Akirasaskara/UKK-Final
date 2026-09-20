import { describe, it, expect } from 'vitest';
import * as argon2 from 'argon2';
import {
  getSeedReferenceDate,
  addDays,
  formatDateString,
  parseTimeOnlyUtc,
  createDateTimeUtc,
  calculateDiscountSnapshot,
  createSha256Hash,
  hashPassword,
} from '../../prisma/seed-helpers.js';

describe('Seed Helpers Unit Tests', () => {
  describe('1. Reference Date & Calendar Arithmetic', () => {
    it('should parse explicit SEED_REFERENCE_DATE correctly', () => {
      const date = getSeedReferenceDate('2026-09-20');
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(8); // 0-indexed September
      expect(date.getUTCDate()).toBe(20);
    });

    it('should add days correctly across month boundaries', () => {
      const base = new Date(Date.UTC(2026, 8, 30)); // 2026-09-30
      const nextDay = addDays(base, 1);
      expect(formatDateString(nextDay)).toBe('2026-10-01');

      const prevDay = addDays(base, -5);
      expect(formatDateString(prevDay)).toBe('2026-09-25');
    });
  });

  describe('2. Time & DateTime Helpers', () => {
    it('should parse time strings to UTC Date on 1970-01-01', () => {
      const time = parseTimeOnlyUtc('09:30');
      expect(time.toISOString()).toBe('1970-01-01T09:30:00.000Z');

      const midnightEnd = parseTimeOnlyUtc('24:00');
      expect(midnightEnd.toISOString()).toBe('1970-01-01T23:59:59.000Z');
    });

    it('should combine date and time into full UTC timestamp', () => {
      const dt = createDateTimeUtc('2026-09-20', '08:30:00');
      expect(dt.toISOString()).toBe('2026-09-20T08:30:00.000Z');
    });
  });

  describe('3. Financial Snapshot Calculations', () => {
    it('should compute standard discount correctly (10%)', () => {
      const res = calculateDiscountSnapshot(25000n, 4, 10);
      expect(res.totalHargaAwal).toBe(100000n);
      expect(res.potonganDiskon).toBe(10000n);
      expect(res.totalHarga).toBe(90000n);
    });

    it('should compute 0% or null discount correctly', () => {
      const res = calculateDiscountSnapshot(30000n, 3, null);
      expect(res.totalHargaAwal).toBe(90000n);
      expect(res.potonganDiskon).toBe(0n);
      expect(res.totalHarga).toBe(90000n);
    });

    it('should compute 100% discount correctly', () => {
      const res = calculateDiscountSnapshot(50000n, 2, 100);
      expect(res.totalHargaAwal).toBe(100000n);
      expect(res.potonganDiskon).toBe(100000n);
      expect(res.totalHarga).toBe(0n);
    });
  });

  describe('4. Hashing Utilities', () => {
    it('should compute deterministic SHA-256 hash', () => {
      const hash = createSha256Hash('VERIFY-RESERVASI-1-BOOK-20260920-001');
      expect(hash).toHaveLength(64);
      expect(createSha256Hash('VERIFY-RESERVASI-1-BOOK-20260920-001')).toBe(hash);
    });

    it('should hash passwords with Argon2id', async () => {
      const hash = await hashPassword('MokletSuperSecret123!');
      expect(hash.startsWith('$argon2id')).toBe(true);
      const isMatch = await argon2.verify(hash, 'MokletSuperSecret123!');
      expect(isMatch).toBe(true);
    });
  });
});
