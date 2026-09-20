import * as crypto from 'crypto';

export function getJakartaDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function calculateEndTime(startTimeStr: string, durationHours: number): string {
  const parts = startTimeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Format jam mulai tidak valid (harus HH:mm)');
  }

  const dur = Number(durationHours);
  if (isNaN(dur) || dur <= 0) {
    throw new Error('Durasi sewa minimal 1 jam');
  }

  const totalHours = hours + dur;
  if (totalHours > 24 || (totalHours === 24 && minutes > 0)) {
    throw new Error('Rentang waktu sewa melewati batas operasional harian (maksimal pukul 24:00)');
  }

  const formattedHours = String(totalHours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}`;
}

export function generateBookingCode(dateStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BOOK-${cleanDate}-${randomHex}`;
}

export function generateTicketNumber(dateStr: string, id: number | bigint): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const paddedId = String(id).padStart(4, '0');
  return `TICKET-MOKLET-${cleanDate}-${paddedId}`;
}
