import { z } from 'zod';
import { ApiError, type ApiErrorCode } from './errors';
import { successEnvelopeSchema, errorEnvelopeSchema } from './envelope';

type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
  token?: string;
};

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function resolveErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'validation';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limited';
    default:
      return status >= 500 ? 'server' : 'validation';
  }
}

async function request<T>(
  url: string,
  init: RequestInit,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  let combinedSignal: AbortSignal = timeoutController.signal;
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError({
        status: 0,
        code: 'network',
        message: 'Permintaan dibatalkan.',
      });
    }
    const merged = new AbortController();
    options.signal.addEventListener('abort', () => merged.abort());
    timeoutController.signal.addEventListener('abort', () => merged.abort());
    combinedSignal = merged.signal;
  }

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value);
    }
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      signal: combinedSignal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      if (options.signal?.aborted) {
        throw new ApiError({
          status: 0,
          code: 'network',
          message: 'Permintaan dibatalkan.',
        });
      }
      throw new ApiError({
        status: 0,
        code: 'timeout',
        message: 'Koneksi melebihi batas waktu (timeout). Silakan periksa jaringan Anda.',
      });
    }
    throw new ApiError({
      status: 0,
      code: 'network',
      message: 'Gagal terhubung ke server. Silakan periksa koneksi Anda.',
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new ApiError({
      status: response.status,
      code: response.ok ? 'contract' : resolveErrorCode(response.status),
      message: response.ok
        ? 'Respon server tidak berformat JSON yang valid.'
        : `Terjadi kesalahan pada server (HTTP ${response.status}).`,
    });
  }

  if (!response.ok) {
    const errorParsed = errorEnvelopeSchema.safeParse(responseBody);
    const message = errorParsed.success
      ? errorParsed.data.message
      : `Terjadi kesalahan pada server (HTTP ${response.status}).`;
    throw new ApiError({
      status: response.status,
      code: resolveErrorCode(response.status),
      message,
      retryAfterSeconds: parseRetryAfter(response.headers.get('Retry-After')),
    });
  }

  const envelopeParsed = successEnvelopeSchema.safeParse(responseBody);
  if (!envelopeParsed.success) {
    throw new ApiError({
      status: response.status,
      code: 'contract',
      message: 'Format respon server tidak sesuai dengan kontrak yang diharapkan.',
    });
  }

  const dataParsed = schema.safeParse(envelopeParsed.data.data);
  if (!dataParsed.success) {
    throw new ApiError({
      status: response.status,
      code: 'contract',
      message: 'Data respon server tidak sesuai dengan skema yang diharapkan.',
    });
  }

  return dataParsed.data;
}

export const apiClient = {
  get: <T>(url: string, schema: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(url, { method: 'GET' }, schema, options),

  post: <T>(url: string, body: unknown, schema: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      schema,
      options,
    ),

  put: <T>(url: string, body: unknown, schema: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      schema,
      options,
    ),

  patch: <T>(url: string, body: unknown, schema: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      schema,
      options,
    ),

  delete: <T>(url: string, schema: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(url, { method: 'DELETE' }, schema, options),
};
