import { randomUUID } from "node:crypto";

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const CORRELATION_ID_KEY = "correlationId";

export type CorrelationHeaders = Record<string, string | string[] | undefined>;
export type CorrelationRequest = { headers: CorrelationHeaders; correlationId?: string };
export type CorrelationResponse = { setHeader(name: string, value: string): void };
export type CorrelationNext = () => void;
export type CorrelationIdGenerator = () => string;

function headerValue(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.trim() || undefined;
}

export function resolveCorrelationId(
  request: Pick<CorrelationRequest, "headers">,
  generate: CorrelationIdGenerator = randomUUID,
): string {
  return headerValue(request.headers[CORRELATION_ID_HEADER]) ?? generate();
}

export function correlationIdMiddleware(
  request: CorrelationRequest,
  response: CorrelationResponse,
  next: CorrelationNext,
  generate: CorrelationIdGenerator = randomUUID,
): void {
  const correlationId = resolveCorrelationId(request, generate);
  request.correlationId = correlationId;
  response.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}

export function getCorrelationId(request: Pick<CorrelationRequest, "correlationId">): string {
  if (!request.correlationId) throw new Error("correlation_id_missing");
  return request.correlationId;
}
