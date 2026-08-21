import { describe, expect, it, vi } from "vitest";
import {
  CORRELATION_ID_HEADER,
  correlationIdMiddleware,
  getCorrelationId,
  resolveCorrelationId,
} from "../../apps/api/src/shared/observability";

describe("correlation ID middleware", () => {
  it("uses a valid inbound correlation ID and returns it in the response", () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    const request = { headers: { [CORRELATION_ID_HEADER]: "  incoming-request  " } };
    const response = { setHeader };

    correlationIdMiddleware(request, response, next, () => "generated-request");

    expect(request).toMatchObject({ correlationId: "incoming-request" });
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, "incoming-request");
    expect(next).toHaveBeenCalledOnce();
  });

  it("generates an ID when the inbound header is missing or blank", () => {
    expect(resolveCorrelationId({ headers: {} }, () => "generated-request")).toBe("generated-request");
    expect(resolveCorrelationId({ headers: { [CORRELATION_ID_HEADER]: "  " } }, () => "generated-request")).toBe(
      "generated-request",
    );
  });

  it("requires middleware to establish the request correlation ID", () => {
    expect(() => getCorrelationId({})).toThrow("correlation_id_missing");
  });
});
