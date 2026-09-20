import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken } from '@/lib/auth/session';
import { unauthorizedSessionResponse, noStoreResponse, gatewayErrorResponse } from '@/lib/auth/bff';
import { fetchUpstream } from '@/lib/server/upstream';
import { isSameOriginRequest, forbiddenOriginResponse } from '@/lib/auth/origin';
import {
  parseAdminReservationList,
  resolveReservationFromTicket,
  toQrVerificationResult,
} from '@/lib/server/qr-compat';

const requestSchema = z.object({
  token: z.string().trim().min(1).max(512),
});

function successEnvelope(data: unknown) {
  return {
    status: true,
    statusCode: 200,
    message: 'Tiket berhasil diverifikasi',
    data,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();

  const token = await getSessionToken();
  if (!token) return unauthorizedSessionResponse();

  const parsedBody = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return noStoreResponse(
      {
        status: false,
        statusCode: 400,
        message: 'Token QR atau kode e-ticket wajib diisi.',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  try {
    // Coba upstream verify-qr terlebih dahulu (berfungsi jika backend sudah diperbarui).
    // Jika backend mengembalikan 400 karena DTO metadata belum sinkron (forbidNonWhitelisted),
    // atau 404 karena endpoint belum ada, langsung fallback ke pencarian owner-scoped.
    const upstreamResponse = await fetchUpstream('/api/admin/reservasi/verify-qr', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: parsedBody.data.token }),
    });

    const upstreamBody = await upstreamResponse.json().catch(() => null);
    if (upstreamResponse.status === 401) return unauthorizedSessionResponse();

    // Hanya pakai respons upstream jika benar-benar sukses
    if (upstreamResponse.ok) return noStoreResponse(upstreamBody, 200);

    // Semua kegagalan (400 DTO rejected, 404 not found, dll) → fallback owner-scoped list
    const reservationResponse = await fetchUpstream('/api/admin/reservasi', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const reservationBody = await reservationResponse.json().catch(() => null);
    if (reservationResponse.status === 401) return unauthorizedSessionResponse();
    if (!reservationResponse.ok) {
      return noStoreResponse(reservationBody, reservationResponse.status);
    }

    const reservations = parseAdminReservationList(reservationBody);
    const matched = reservations
      ? resolveReservationFromTicket(parsedBody.data.token, reservations)
      : null;

    if (!matched) {
      return noStoreResponse(
        {
          status: false,
          statusCode: 404,
          message: 'Tiket tidak ditemukan atau bukan milik coworking space Anda.',
          error: 'Not Found',
          timestamp: new Date().toISOString(),
        },
        404,
      );
    }

    return noStoreResponse(successEnvelope(toQrVerificationResult(matched)), 200);
  } catch (error: unknown) {
    return gatewayErrorResponse(error);
  }
}
