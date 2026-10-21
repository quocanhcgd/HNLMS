import { describe, expect, it } from "vitest";
import { applySecurityHeaders, assertRequestSize, FixedWindowRateLimiter, isAllowedCorsOrigin, isCsrfSafeRequest } from "./security";

describe("HTTP security policy", () => {
  it("sets baseline headers and restricts origins", () => {
    const headers = new Map<string, string>();
    applySecurityHeaders({ setHeader: (name, value) => headers.set(name, value) });
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(isAllowedCorsOrigin("http://localhost:3100", "http://localhost:3100")).toBe(true);
    expect(isAllowedCorsOrigin("https://evil.test", "http://localhost:3100")).toBe(false);
  });
  it("enforces CSRF origin, request size and rate limit", () => {
    expect(isCsrfSafeRequest({ method: "GET" }, "http://localhost:3100")).toBe(true);
    expect(isCsrfSafeRequest({ method: "POST", headers: { origin: "https://evil.test" } }, "http://localhost:3100")).toBe(false);
    expect(() => assertRequestSize("1048577")).toThrow("request_too_large");
    const limiter = new FixedWindowRateLimiter(2, 1000);
    expect(limiter.allow("u", 0)).toBe(true); expect(limiter.allow("u", 1)).toBe(true); expect(limiter.allow("u", 2)).toBe(false); expect(limiter.allow("u", 1001)).toBe(true);
  });
});
