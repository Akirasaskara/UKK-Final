import * as crypto from 'crypto';
import * as argon2 from 'argon2';

/**
 * Resolves the reference date for the seed (UTC Date at 00:00:00.000Z).
 * Defaults to today's date in Asia/Jakarta timezone.
 */
export function getSeedReferenceDate(envValue?: string): Date {
  if (envValue && /^\d{4}-\d{2}-\d{2}$/.test(envValue)) {
    const [y, m, d] = envValue.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = formatter.format(new Date()).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Adds or subtracts days from a UTC date without timezone drift.
 */
export function addDays(baseDate: Date, days: number): Date {
  const result = new Date(baseDate.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Formats a Date object to strict YYYY-MM-DD.
 */
export function formatDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Creates a UTC Date object representing a specific time of day (1970-01-01THH:mm:00.000Z).
 * For 24:00, it maps safely to 1970-01-01T23:59:59.000Z.
 */
export function parseTimeOnlyUtc(timeStr: string): Date {
  if (timeStr === '24:00') {
    return new Date('1970-01-01T23:59:59.000Z');
  }
  return new Date(`1970-01-01T${timeStr}:00.000Z`);
}

/**
 * Creates a full UTC DateTime combining date string (YYYY-MM-DD) and time string (HH:mm:ss).
 */
export function createDateTimeUtc(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}.000Z`);
}

/**
 * Computes financial snapshot values using integer BigInt arithmetic.
 */
export function calculateDiscountSnapshot(
  hargaPerJam: bigint,
  durasiJam: number,
  persentaseDiskon: number | null,
): {
  totalHargaAwal: bigint;
  potonganDiskon: bigint;
  totalHarga: bigint;
} {
  const totalHargaAwal = hargaPerJam * BigInt(durasiJam);
  let potonganDiskon = 0n;

  if (persentaseDiskon && persentaseDiskon > 0 && persentaseDiskon <= 100) {
    potonganDiskon = (totalHargaAwal * BigInt(persentaseDiskon)) / 100n;
  }

  const totalHarga = totalHargaAwal > potonganDiskon ? totalHargaAwal - potonganDiskon : 0n;

  return {
    totalHargaAwal,
    potonganDiskon,
    totalHarga,
  };
}

/**
 * Generates a SHA-256 hash for QR or idempotency keys.
 */
export function createSha256Hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Hashes password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}
