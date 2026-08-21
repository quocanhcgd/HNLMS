import "reflect-metadata";

export const HTTP_METADATA_KEYS = {
  operation: "hnlms:http:operation",
  response: "hnlms:http:response",
  errors: "hnlms:http:errors",
} as const;

export interface OpenApiOperationMetadata {
  operationId: string;
  summary: string;
  tags: string[];
}

export interface OpenApiResponseMetadata {
  status: number;
  description: string;
  schema: string;
}

export interface OpenApiErrorMetadata {
  status: number;
  code: string;
  description: string;
}

export interface OpenApiRoute {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  handler: object;
}

export interface OpenApiDocumentOptions {
  title: string;
  version: string;
  description?: string;
  routes: OpenApiRoute[];
}

type OpenApiSchema = Record<string, unknown>;
type OpenApiOperation = Record<string, unknown>;

const errorEnvelopeSchema: OpenApiSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message", "correlation_id", "details"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        correlation_id: { type: "string" },
        details: { type: "object", additionalProperties: true },
      },
    },
  },
};

/** Framework-neutral metadata descriptors consumed by the API OpenAPI adapter. */
export function httpOperation(metadata: OpenApiOperationMetadata): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.operation, metadata, descriptor?.value ?? _target);
  };
}

export function httpResponse(metadata: OpenApiResponseMetadata): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.response, metadata, descriptor?.value ?? _target);
  };
}

export function httpErrors(...metadata: OpenApiErrorMetadata[]): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.errors, metadata, descriptor?.value ?? _target);
  };
}

/** Builds a serializable OpenAPI 3.1 document from HTTP handler metadata. */
export function buildOpenApiDocument(options: OpenApiDocumentOptions): Record<string, unknown> {
  const paths: Record<string, Record<string, OpenApiOperation>> = {};
  for (const route of options.routes) {
    const operation = Reflect.getMetadata(HTTP_METADATA_KEYS.operation, route.handler) as
      OpenApiOperationMetadata | undefined;
    if (!operation) throw new Error(`missing_openapi_operation_metadata:${route.method}:${route.path}`);
    const response = Reflect.getMetadata(HTTP_METADATA_KEYS.response, route.handler) as
      OpenApiResponseMetadata | undefined;
    const errors =
      (Reflect.getMetadata(HTTP_METADATA_KEYS.errors, route.handler) as OpenApiErrorMetadata[] | undefined) ?? [];
    const responses: Record<string, unknown> = {};
    if (response) {
      responses[String(response.status)] = {
        description: response.description,
        content: { "application/json": { schema: { $ref: `#/components/schemas/${response.schema}` } } },
      };
    }
    for (const error of errors) {
      responses[String(error.status)] = {
        description: error.description,
        headers: { "X-Correlation-Id": { schema: { type: "string" } } },
        content: {
          "application/json": {
            schema: {
              allOf: [{ $ref: "#/components/schemas/ApiErrorEnvelope" }, { description: `Error code: ${error.code}` }],
            },
          },
        },
      };
    }
    paths[route.path] ??= {};
    paths[route.path][route.method] = { ...operation, responses };
  }
  return {
    openapi: "3.1.0",
    info: { title: options.title, version: options.version, description: options.description },
    paths,
    components: { schemas: { ApiErrorEnvelope: errorEnvelopeSchema } },
  };
}
