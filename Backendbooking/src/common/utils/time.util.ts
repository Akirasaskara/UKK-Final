import * as crypto from 'crypto';

export function calculateEndTime(startTimeStr: string, durationHours: number): string {
  const parts = startTimeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  const totalHours = hours + Number(durationHours);
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
