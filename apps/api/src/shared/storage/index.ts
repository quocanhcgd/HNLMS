import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { canAccessResource, type AuthorizationContext, type ScopedResource } from "@hnlms/authorization";

export type StorageObjectMetadata = ScopedResource & {
  id: string;
  storageKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  checksum: string;
  ownerId: string;
  createdAt: Date;
};

export type CreateStorageObjectMetadata = ScopedResource & {
  id: string;
  storageKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  checksum: string;
  ownerId: string;
  createdAt?: Date;
};

export type StorageObject = { metadata: StorageObjectMetadata; body: Uint8Array };
export type SignedUrlOperation = "download" | "playback";
export type SignedStorageUrl = { url: string; token: string; expiresAt: Date; operation: SignedUrlOperation };

export type CreateSignedUrlInput = {
  objectId: string;
  context: AuthorizationContext;
  operation: SignedUrlOperation;
  expiresInSeconds?: number;
};

export type ResolveSignedUrlInput = { token: string; context: AuthorizationContext; now?: Date };

export interface PrivateObjectStorage {
  put(input: CreateStorageObjectMetadata & { body: Uint8Array }): StorageObjectMetadata;
  getMetadata(objectId: string): StorageObjectMetadata | undefined;
  createSignedUrl(input: CreateSignedUrlInput): SignedStorageUrl;
  resolveSignedUrl(input: ResolveSignedUrlInput): StorageObject;
}

type SignedUrlClaims = {
  objectId: string;
  operation: SignedUrlOperation;
  expiresAt: number;
  nonce: string;
};

export class StorageAuthorizationError extends Error {
  constructor(public readonly code: "object_not_found" | "forbidden" | "invalid_signed_url" | "signed_url_expired") {
    super(code);
  }
}

/** Test-only private storage adapter; production adapters must preserve this authorization contract. */
export class InMemoryPrivateObjectStorage implements PrivateObjectStorage {
  private readonly objects = new Map<string, StorageObject>();
  private readonly signingSecret: Buffer;
  private readonly baseUrl: string;
  private readonly defaultExpiresInSeconds: number;

  constructor(options: { signingSecret?: string; baseUrl?: string; defaultExpiresInSeconds?: number } = {}) {
    this.signingSecret = Buffer.from(options.signingSecret ?? randomBytes(32).toString("base64url"));
    this.baseUrl = options.baseUrl ?? "https://storage.invalid/private";
    this.defaultExpiresInSeconds = options.defaultExpiresInSeconds ?? 300;
    if (this.defaultExpiresInSeconds <= 0) throw new Error("invalid_signed_url_expiry");
  }

  put(input: CreateStorageObjectMetadata & { body: Uint8Array }): StorageObjectMetadata {
    if (this.objects.has(input.id)) throw new Error("storage_object_already_exists");
    if (!input.id || !input.storageKey || !input.filename || !input.contentType || !input.checksum) {
      throw new Error("invalid_storage_object_metadata");
    }
    if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 0 || input.sizeBytes !== input.body.byteLength) {
      throw new Error("invalid_storage_object_size");
    }

    const metadata: StorageObjectMetadata = {
      id: input.id,
      storageKey: input.storageKey,
      filename: input.filename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      checksum: input.checksum,
      ownerId: input.ownerId,
      organizationId: input.organizationId,
      branchId: input.branchId,
      classId: input.classId,
      studentId: input.studentId,
      createdAt: input.createdAt ?? new Date(),
    };
    this.objects.set(input.id, { metadata, body: new Uint8Array(input.body) });
    return { ...metadata };
  }

  getMetadata(objectId: string): StorageObjectMetadata | undefined {
    const object = this.objects.get(objectId);
    return object ? { ...object.metadata } : undefined;
  }

  createSignedUrl(input: CreateSignedUrlInput): SignedStorageUrl {
    const object = this.requireObject(input.objectId);
    this.assertAuthorized(input.context, object.metadata);
    const expiresInSeconds = input.expiresInSeconds ?? this.defaultExpiresInSeconds;
    if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds <= 0) throw new Error("invalid_signed_url_expiry");

    const claims: SignedUrlClaims = {
      objectId: object.metadata.id,
      operation: input.operation,
      expiresAt: Date.now() + expiresInSeconds * 1000,
      nonce: randomBytes(16).toString("base64url"),
    };
    const token = this.signClaims(claims);
    return {
      token,
      operation: claims.operation,
      expiresAt: new Date(claims.expiresAt),
      url: `${this.baseUrl}/${encodeURIComponent(object.metadata.storageKey)}?token=${encodeURIComponent(token)}`,
    };
  }

  resolveSignedUrl(input: ResolveSignedUrlInput): StorageObject {
    const claims = this.verifyClaims(input.token);
    const now = input.now ?? new Date();
    if (claims.expiresAt <= now.getTime()) throw new StorageAuthorizationError("signed_url_expired");

    const object = this.requireObject(claims.objectId);
    // Re-check current scope so a previously issued URL cannot outlive revoked access.
    this.assertAuthorized(input.context, object.metadata);
    return { metadata: { ...object.metadata }, body: new Uint8Array(object.body) };
  }

  private requireObject(objectId: string): StorageObject {
    const object = this.objects.get(objectId);
    if (!object) throw new StorageAuthorizationError("object_not_found");
    return object;
  }

  private assertAuthorized(context: AuthorizationContext, metadata: StorageObjectMetadata): void {
    if (!canAccessResource(context, metadata)) throw new StorageAuthorizationError("forbidden");
  }

  private signClaims(claims: SignedUrlClaims): string {
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `${payload}.${this.sign(payload)}`;
  }

  private verifyClaims(token: string): SignedUrlClaims {
    const [payload, signature, ...remaining] = token.split(".");
    if (!payload || !signature || remaining.length) throw new StorageAuthorizationError("invalid_signed_url");
    const expected = Buffer.from(this.sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new StorageAuthorizationError("invalid_signed_url");
    }
    try {
      const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SignedUrlClaims>;
      if (
        typeof value.objectId !== "string" ||
        (value.operation !== "download" && value.operation !== "playback") ||
        !Number.isSafeInteger(value.expiresAt) ||
        typeof value.nonce !== "string"
      ) {
        throw new Error("invalid");
      }
      return value as SignedUrlClaims;
    } catch {
      throw new StorageAuthorizationError("invalid_signed_url");
    }
  }

  private sign(payload: string): string {
    return createHmac("sha256", this.signingSecret).update(payload).digest("base64url");
  }
}
