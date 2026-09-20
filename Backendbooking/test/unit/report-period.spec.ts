import { describe, it, expect } from 'vitest';
import {
  isValidDateString,
  getDaysDifference,
  validateReportRange,
  generateTimeBuckets,
  findBucketIndex,
} from '../../src/common/utils/report-period.util.js';

describe('Report Period Utility & Time-Series Bucketing Unit Tests', () => {
  describe('1. Date String Validation', () => {
    it('should accept valid calendar dates', () => {
      expect(isValidDateString('2026-09-01')).toBe(true);
      expect(isValidDateString('2026-02-28')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // 2024 is leap year
      expect(isValidDateString('2026-12-31')).toBe(true);
    });

    it('should reject invalid calendar dates', () => {
      expect(isValidDateString('2026-02-29')).toBe(false); // 2026 is not leap year
      expect(isValidDateString('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidDateString('2026-13-01')).toBe(false);
      expect(isValidDateString('2026-00-10')).toBe(false);
      expect(isValidDateString('invalid-date')).toBe(false);
      expect(isValidDateString('2026-9-1')).toBe(false);
      expect(isValidDateString('2026-09-01T00:00:00Z')).toBe(false);
    });
  });

  describe('2. Date Difference & Range Validation', () => {
    it('should correctly calculate inclusive days between dates', () => {
      expect(getDaysDifference('2026-09-01', '2026-09-01')).toBe(1);
      expect(getDaysDifference('2026-09-01', '2026-09-07')).toBe(7);
      expect(getDaysDifference('2026-09-01', '2026-09-30')).toBe(30);
    });

    it('should reject from > to', () => {
      const err = validateReportRange('day', '2026-09-10', '2026-09-01');
      expect(err).toContain('tidak boleh lebih besar');
    });

    it('should enforce 31-day limit for daily granularity', () => {
      expect(validateReportRange('day', '2026-09-01', '2026-09-30')).toBeNull();
      const err = validateReportRange('day', '2026-09-01', '2026-10-15'); // 45 days
      expect(err).toContain('maksimal 31 hari');
    });

    it('should enforce 93-day limit for weekly granularity', () => {
      expect(validateReportRange('week', '2026-09-01', '2026-11-30')).toBeNull(); // 91 days
      const err = validateReportRange('week', '2026-01-01', '2026-06-01'); // > 150 days
      expect(err).toContain('maksimal 93 hari');
    });

    it('should enforce 366-day limit for monthly granularity', () => {
      expect(validateReportRange('month', '2026-01-01', '2026-12-31')).toBeNull(); // 365 days
      const err = validateReportRange('month', '2025-01-01', '2026-12-31'); // 730 days
      expect(err).toContain('maksimal 366 hari');
    });
  });

  describe('3. Time Bucket Generation (Zero-Filled)', () => {
    it('should generate daily buckets for 5 days', () => {
      const buckets = generateTimeBuckets('day', '2026-09-01', '2026-09-05');
      expect(buckets).toHaveLength(5);
      expect(buckets[0].bucket_start).toBe('2026-09-01');
      expect(buckets[0].bucket_end).toBe('2026-09-01');
      expect(buckets[0].label).toBe('01 Sep');
      expect(buckets[4].bucket_start).toBe('2026-09-05');
      expect(buckets[4].label).toBe('05 Sep');
    });

    it('should generate ISO week buckets', () => {
      // 2026-09-01 is Tuesday. Week 1 ends Sunday 2026-09-06.
      // Week 2: 2026-09-07 (Mon) to 2026-09-13 (Sun).
      // Week 3: 2026-09-14 (Mon) to 2026-09-15 (Tue).
      const buckets = generateTimeBuckets('week', '2026-09-01', '2026-09-15');
      expect(buckets).toHaveLength(3);
      expect(buckets[0].bucket_start).toBe('2026-09-01');
      expect(buckets[0].bucket_end).toBe('2026-09-06');
      expect(buckets[1].bucket_start).toBe('2026-09-07');
      expect(buckets[1].bucket_end).toBe('2026-09-13');
      expect(buckets[2].bucket_start).toBe('2026-09-14');
      expect(buckets[2].bucket_end).toBe('2026-09-15');
    });

    it('should generate monthly buckets across calendar boundaries', () => {
      const buckets = generateTimeBuckets('month', '2026-09-15', '2026-11-20');
      expect(buckets).toHaveLength(3);
      expect(buckets[0].bucket_start).toBe('2026-09-15');
      expect(buckets[0].bucket_end).toBe('2026-09-30');
      expect(buckets[0].label).toBe('Sep 2026');
      expect(buckets[1].bucket_start).toBe('2026-10-01');
      expect(buckets[1].bucket_end).toBe('2026-10-31');
      expect(buckets[1].label).toBe('Okt 2026');
      expect(buckets[2].bucket_start).toBe('2026-11-01');
      expect(buckets[2].bucket_end).toBe('2026-11-20');
      expect(buckets[2].label).toBe('Nov 2026');
    });
  });

  describe('4. Finding Matching Bucket Index', () => {
    it('should find correct bucket for transaction date', () => {
      const buckets = generateTimeBuckets('week', '2026-09-01', '2026-09-15');
      expect(findBucketIndex(buckets, '2026-09-01')).toBe(0);
      expect(findBucketIndex(buckets, '2026-09-06')).toBe(0);
      expect(findBucketIndex(buckets, '2026-09-07')).toBe(1);
      expect(findBucketIndex(buckets, '2026-09-12')).toBe(1);
      expect(findBucketIndex(buckets, '2026-09-15')).toBe(2);
      expect(findBucketIndex(buckets, '2026-09-20')).toBe(-1); // Out of bounds
    });
  });
});
