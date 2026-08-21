import "reflect-metadata";
import { describe, expect, it } from "vitest";
import {
  ApiError,
  HTTP_METADATA_KEYS,
  buildOpenApiDocument,
  createErrorEnvelope,
  toErrorEnvelope,
  httpErrors,
  httpOperation,
  httpResponse,
} from "../../apps/api/src/shared/http";

describe("HTTP error envelope", () => {
  it("returns the contracted safe error envelope", () => {
    expect(
      createErrorEnvelope({
        code: "forbidden",
        message: "Access denied.",
        correlationId: "corr-123",
        details: { required_permission: "reports.export" },
      }),
    ).toEqual({
      error: {
        code: "forbidden",
        message: "Access denied.",
        correlation_id: "corr-123",
        details: { required_permission: "reports.export" },
      },
    });
  });

  it("does not expose unexpected error causes", () => {
    const error = new Error("database password: secret");
    expect(toErrorEnvelope(error, "corr-456")).toEqual({
      error: {
        code: "internal_error",
        message: "An unexpected error occurred.",
        correlation_id: "corr-456",
        details: {},
      },
    });
    expect(
      toErrorEnvelope(new ApiError({ code: "not_found", message: "Not found.", correlationId: "corr-789" }), "other"),
    ).toMatchObject({ error: { code: "not_found", correlation_id: "corr-789" } });
  });
});

describe("HTTP OpenAPI metadata", () => {
  it("attaches metadata and generates a safe OpenAPI operation", () => {
    class ReportsController {
      list() {}
    }
    const descriptor = Object.getOwnPropertyDescriptor(ReportsController.prototype, "list")!;
    const operation = { operationId: "listReports", summary: "List reports", tags: ["reports"] };
    const response = { status: 200, description: "A page of reports", schema: "PaginatedReport" };
    const errors = [{ status: 403, code: "forbidden", description: "Scope is denied" }];

    httpOperation(operation)(ReportsController.prototype, "list", descriptor);
    httpResponse(response)(ReportsController.prototype, "list", descriptor);
    httpErrors(...errors)(ReportsController.prototype, "list", descriptor);

    expect(Reflect.getMetadata(HTTP_METADATA_KEYS.operation, ReportsController.prototype.list)).toEqual(operation);
    expect(Reflect.getMetadata(HTTP_METADATA_KEYS.response, ReportsController.prototype.list)).toEqual(response);
    expect(Reflect.getMetadata(HTTP_METADATA_KEYS.errors, ReportsController.prototype.list)).toEqual(errors);
    expect(
      buildOpenApiDocument({
        title: "HN-LMS API",
        version: "0.1.0",
        routes: [{ method: "get", path: "/reports", handler: ReportsController.prototype.list }],
      }),
    ).toMatchObject({
      openapi: "3.1.0",
      paths: {
        "/reports": {
          get: {
            operationId: "listReports",
            responses: {
              "403": { headers: { "X-Correlation-Id": { schema: { type: "string" } } } },
            },
          },
        },
      },
      components: { schemas: { ApiErrorEnvelope: expect.any(Object) } },
    });
  });
});
