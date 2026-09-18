export type ApiErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'contract'
  | 'network'
  | 'timeout'
  | 'server';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly fieldErrors?: Record<string, string[]>;
  public readonly retryAfterSeconds?: number;

  constructor(params: {
    status: number;
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    retryAfterSeconds?: number;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors;
    this.retryAfterSeconds = params.retryAfterSeconds;
  }
}
