import { describe, expect, it } from "vitest";
import { createAuthorizationContext } from "@hnlms/authorization";
import {
  InMemoryPrivateObjectStorage,
  StorageAuthorizationError,
  type AuthorizationContext,
} from "../../apps/api/src/shared/storage";

const originalBody = new TextEncoder().encode("private course material");
const owner = createAuthorizationContext({
  userId: "teacher-1",
  organizationId: "org-a",
  branchIds: ["branch-a"],
  classIds: ["class-a"],
  studentIds: ["student-a"],
});

function createStorage(): InMemoryPrivateObjectStorage {
  const storage = new InMemoryPrivateObjectStorage({
    signingSecret: "storage-test-secret",
    baseUrl: "https://objects.example.test/private",
  });
  storage.put({
    id: "asset-1",
    storageKey: "org-a/media/asset-1.pdf",
    filename: "lesson.pdf",
    contentType: "application/pdf",
    sizeBytes: originalBody.byteLength,
    checksum: "sha256:abc",
    ownerId: "teacher-1",
    organizationId: "org-a",
    branchId: "branch-a",
    classId: "class-a",
    studentId: "student-a",
    body: originalBody,
  });
  return storage;
}

describe("InMemoryPrivateObjectStorage", () => {
  it("keeps bytes private and issues a short-lived URL only after scope authorization", () => {
    const storage = createStorage();
    const signed = storage.createSignedUrl({
      objectId: "asset-1",
      context: owner,
      operation: "playback",
      expiresInSeconds: 60,
    });

    expect(storage.getMetadata("asset-1")).toMatchObject({ id: "asset-1", storageKey: "org-a/media/asset-1.pdf" });
    expect(signed.url).toContain("https://objects.example.test/private/org-a%2Fmedia%2Fasset-1.pdf?token=");
    expect(signed.operation).toBe("playback");
    expect(signed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(new TextDecoder().decode(storage.resolveSignedUrl({ token: signed.token, context: owner }).body)).toBe(
      "private course material",
    );
  });

  it("denies URL issuance and redemption outside the current organization or resource scope", () => {
    const storage = createStorage();
    const wrongOrganization = createAuthorizationContext({ userId: "user-2", organizationId: "org-b" });
    const wrongBranch = createAuthorizationContext({
      userId: "user-3",
      organizationId: "org-a",
      branchIds: ["branch-b"],
      classIds: ["class-a"],
      studentIds: ["student-a"],
    });
    const signed = storage.createSignedUrl({ objectId: "asset-1", context: owner, operation: "download" });

    expect(() =>
      storage.createSignedUrl({ objectId: "asset-1", context: wrongOrganization, operation: "download" }),
    ).toThrow(new StorageAuthorizationError("forbidden"));
    expect(() => storage.resolveSignedUrl({ token: signed.token, context: wrongBranch })).toThrow(
      new StorageAuthorizationError("forbidden"),
    );
  });

  it("rejects expired and tampered signed URLs", () => {
    const storage = createStorage();
    const expired = storage.createSignedUrl({
      objectId: "asset-1",
      context: owner,
      operation: "download",
      expiresInSeconds: 1,
    });
    const tampered = `${expired.token.slice(0, -1)}x`;

    expect(() =>
      storage.resolveSignedUrl({ token: expired.token, context: owner, now: new Date(expired.expiresAt) }),
    ).toThrow(new StorageAuthorizationError("signed_url_expired"));
    expect(() => storage.resolveSignedUrl({ token: tampered, context: owner })).toThrow(
      new StorageAuthorizationError("invalid_signed_url"),
    );
  });

  it("rechecks authorization at redemption after a scope grant is revoked", () => {
    const storage = createStorage();
    const signed = storage.createSignedUrl({ objectId: "asset-1", context: owner, operation: "download" });
    const revokedContext: AuthorizationContext = createAuthorizationContext({
      userId: "teacher-1",
      organizationId: "org-a",
      branchIds: ["branch-a"],
    });

    expect(() => storage.resolveSignedUrl({ token: signed.token, context: revokedContext })).toThrow(
      new StorageAuthorizationError("forbidden"),
    );
  });

  it("does not expose mutable stored bytes through put or resolve", () => {
    const storage = createStorage();
    originalBody[0] = 0;
    const signed = storage.createSignedUrl({ objectId: "asset-1", context: owner, operation: "download" });
    const resolved = storage.resolveSignedUrl({ token: signed.token, context: owner });
    resolved.body[0] = 0;

    expect(new TextDecoder().decode(storage.resolveSignedUrl({ token: signed.token, context: owner }).body)).toBe(
      "private course material",
    );
  });
});
