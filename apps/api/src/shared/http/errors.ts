export type ApiErrorDetails = Record<string, unknown>;

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    correlation_id: string;
    details: ApiErrorDetails;
  };
}

export interface ApiErrorOptions {
  code: string;
  message: string;
  correlationId: string;
  details?: ApiErrorDetails;
  statusCode?: number;
  cause?: unknown;
}

/** A transport-safe error that can be returned by any API adapter. */
export class ApiError extends Error {
  readonly code: string;
  readonly correlationId: string;
  readonly details: ApiErrorDetails;
  readonly statusCode: number;

  constructor(options: ApiErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "ApiError";
    this.code = options.code;
    this.correlationId = options.correlationId;
    this.details = options.details ?? {};
    this.statusCode = options.statusCode ?? 400;
  }

  toEnvelope(): ApiErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        correlation_id: this.correlationId,
        details: this.details,
      },
    };
  }
}

export function createErrorEnvelope(options: ApiErrorOptions): ApiErrorEnvelope {
  return new ApiError(options).toEnvelope();
}

/** Converts unknown thrown values without exposing stack traces or causes. */
export function toErrorEnvelope(error: unknown, correlationId: string): ApiErrorEnvelope {
  if (error instanceof ApiError) return error.toEnvelope();
  return createErrorEnvelope({
    code: "internal_error",
    message: "An unexpected error occurred.",
    correlationId,
    statusCode: 500,
  });
}
