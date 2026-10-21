export type HttpResponseLike = { setHeader(name: string, value: string): void };
export type HttpRequestLike = { method?: string; headers?: Record<string, string | string[] | undefined>; ip?: string };

export function applySecurityHeaders(response: HttpResponseLike) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'");
}

export function isAllowedCorsOrigin(origin: string | undefined, allowedOrigin: string): boolean {
  return !origin || origin === allowedOrigin;
}

export function isCsrfSafeRequest(request: HttpRequestLike, allowedOrigin: string): boolean {
  if (!request.method || ["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return true;
  const origin = request.headers?.origin;
  return typeof origin === "string" && origin === allowedOrigin;
}

export class FixedWindowRateLimiter {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();
  constructor(private readonly max = 100, private readonly windowMs = 60_000) {}
  allow(key: string, now = Date.now()): boolean {
    const current = this.windows.get(key);
    if (!current || current.resetAt <= now) { this.windows.set(key, { count: 1, resetAt: now + this.windowMs }); return true; }
    if (current.count >= this.max) return false;
    current.count += 1;
    return true;
  }
}

export function assertRequestSize(contentLength: string | undefined, maxBytes = 1_048_576) {
  if (contentLength !== undefined && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) throw new Error("request_too_large");
}
