export type Granularity = 'day' | 'week' | 'month';

export interface ReportBucket {
  key: string;
  bucket_start: string;
  bucket_end: string;
  label: string;
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
];

/**
 * Validates a strict YYYY-MM-DD calendar date string.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) {
    return false;
  }

  // Verify calendar validity (e.g. leap years, 30-day months)
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Parses YYYY-MM-DD into a UTC Date object set at 00:00:00.000Z.
 */
export function parseDateOnlyUtc(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date object to YYYY-MM-DD.
 */
export function formatDateOnlyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the inclusive number of days between two YYYY-MM-DD dates.
 */
export function getDaysDifference(fromStr: string, toStr: string): number {
  const fromDate = parseDateOnlyUtc(fromStr);
  const toDate = parseDateOnlyUtc(toStr);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Validates date range constraints per granularity.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateReportRange(
  granularity: Granularity,
  fromStr: string,
  toStr: string,
): string | null {
  if (!isValidDateString(fromStr)) {
    return 'Format tanggal awal (from) tidak valid (wajib YYYY-MM-DD).';
  }
  if (!isValidDateString(toStr)) {
    return 'Format tanggal akhir (to) tidak valid (wajib YYYY-MM-DD).';
  }

  const diffDays = getDaysDifference(fromStr, toStr);
  if (diffDays <= 0) {
    return 'Tanggal awal (from) tidak boleh lebih besar dari tanggal akhir (to).';
  }

  switch (granularity) {
    case 'day':
      if (diffDays > 31) {
        return 'Rentang laporan harian maksimal 31 hari.';
      }
      break;
    case 'week':
      if (diffDays > 93) {
        return 'Rentang laporan mingguan maksimal 93 hari (sekitar 13 minggu).';
      }
      break;
    case 'month':
      if (diffDays > 366) {
        return 'Rentang laporan bulanan maksimal 366 hari (12 bulan).';
      }
      break;
    default:
      return 'Granularity tidak valid. Pilih antara day, week, atau month.';
  }

  return null;
}

/**
 * Generates continuous zero-filled time buckets for the given range and granularity.
 */
export function generateTimeBuckets(
  granularity: Granularity,
  fromStr: string,
  toStr: string,
): ReportBucket[] {
  const fromDate = parseDateOnlyUtc(fromStr);
  const toDate = parseDateOnlyUtc(toStr);
  const buckets: ReportBucket[] = [];

  if (granularity === 'day') {
    const current = new Date(fromDate.getTime());
    while (current.getTime() <= toDate.getTime()) {
      const dStr = formatDateOnlyUtc(current);
      const day = current.getUTCDate();
      const monthIdx = current.getUTCMonth();
      const label = `${String(day).padStart(2, '0')} ${MONTH_SHORT_ID[monthIdx]}`;

      buckets.push({
        key: dStr,
        bucket_start: dStr,
        bucket_end: dStr,
        label,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }
  } else if (granularity === 'week') {
    const current = new Date(fromDate.getTime());
    let weekIndex = 1;

    while (current.getTime() <= toDate.getTime()) {
      const startStr = formatDateOnlyUtc(current);
      
      // Find the end of this ISO week (Sunday) or toDate, whichever is earlier
      const dayOfWeek = current.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      
      const weekEnd = new Date(current.getTime());
      weekEnd.setUTCDate(weekEnd.getUTCDate() + daysUntilSunday);

      const effectiveEnd = weekEnd.getTime() > toDate.getTime() ? new Date(toDate.getTime()) : weekEnd;
      const endStr = formatDateOnlyUtc(effectiveEnd);

      const startDay = current.getUTCDate();
      const startMonth = MONTH_SHORT_ID[current.getUTCMonth()];
      const endDay = effectiveEnd.getUTCDate();
      const endMonth = MONTH_SHORT_ID[effectiveEnd.getUTCMonth()];

      const label = startMonth === endMonth
        ? `Mgg ${weekIndex} (${startDay}–${endDay} ${startMonth})`
        : `Mgg ${weekIndex} (${startDay} ${startMonth}–${endDay} ${endMonth})`;

      buckets.push({
        key: `${startStr}_${endStr}`,
        bucket_start: startStr,
        bucket_end: endStr,
        label,
      });

      weekIndex++;
      // Advance to the day after effectiveEnd
      current.setTime(effectiveEnd.getTime());
      current.setUTCDate(current.getUTCDate() + 1);
    }
  } else if (granularity === 'month') {
    const current = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 1));
    const finalMonth = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), 1));

    while (current.getTime() <= finalMonth.getTime()) {
      const year = current.getUTCFullYear();
      const monthIdx = current.getUTCMonth();
      
      // Calculate first and last day of month bounded by fromDate and toDate
      const firstDayOfMonth = new Date(Date.UTC(year, monthIdx, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, monthIdx + 1, 0));

      const effectiveStart = firstDayOfMonth.getTime() < fromDate.getTime() ? fromDate : firstDayOfMonth;
      const effectiveEnd = lastDayOfMonth.getTime() > toDate.getTime() ? toDate : lastDayOfMonth;

      const startStr = formatDateOnlyUtc(effectiveStart);
      const endStr = formatDateOnlyUtc(effectiveEnd);
      const label = `${MONTH_SHORT_ID[monthIdx]} ${year}`;

      buckets.push({
        key: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
        bucket_start: startStr,
        bucket_end: endStr,
        label,
      });

      current.setUTCMonth(current.getUTCMonth() + 1);
    }
  }

  return buckets;
}

/**
 * Finds the index of the matching bucket for a given reservation date string (YYYY-MM-DD).
 */
export function findBucketIndex(
  buckets: ReportBucket[],
  dateStr: string,
): number {
  return buckets.findIndex(
    (b) => dateStr >= b.bucket_start && dateStr <= b.bucket_end,
  );
}
