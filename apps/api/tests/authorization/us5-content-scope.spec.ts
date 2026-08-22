import { describe, expect, it } from "vitest";
import { InMemoryPrivateObjectStorage } from "../../src/shared/storage/index.js";
import { AcademicLearningService } from "../../src/modules/academic-learning/academic-learning.service.js";
import { InMemoryAcademicRepository } from "../../src/modules/academic-learning/in-memory-academic-repository.js";

const actor = { userId: "teacher-1", organizationId: "org-1", classIds: new Set(["class-1"]) };
const outsider = { userId: "teacher-2", organizationId: "org-1", classIds: new Set(["class-2"]) };

function fixture() {
  const repository = new InMemoryAcademicRepository();
  let n = 0;
  const service = new AcademicLearningService(repository, (kind) => `${kind}-${++n}`);
  return { repository, service };
}

describe("US5 content scope authorization", () => {
  it("prevents users outside class scope from creating class-scoped learning content", () => {
    const { service } = fixture();
    expect(() =>
      service.createLearningContentDraft(outsider, {
        title: "Scoped lesson",
        contentType: "lesson",
        accessScope: "class",
        classId: "class-1",
        document: { blocks: [] },
      }),
    ).toThrow("class_outside_scope");
  });

  it("prevents users outside class scope from saving or downloading class-scoped resources", () => {
    const { service } = fixture();
    const storage = new InMemoryPrivateObjectStorage({ signingSecret: "us5-secret", baseUrl: "https://files.test" });
    const file = service.createFileAsset(actor, {
      storageKey: "org-1/classes/class-1/handout.pdf",
      originalFilename: "handout.pdf",
      mimeType: "application/pdf",
      sizeBytes: 3,
      checksumSha256: "checksum-handout",
    });
    storage.put({
      id: file.id,
      storageKey: file.storageKey,
      filename: file.originalFilename,
      contentType: file.mimeType,
      sizeBytes: 3,
      checksum: file.checksumSha256,
      ownerId: actor.userId,
      organizationId: actor.organizationId,
      classId: "class-1",
      body: new Uint8Array([1, 2, 3]),
    });

    const { resource } = service.createLibraryResourceDraft(actor, {
      title: "Class handout",
      kind: "document",
      category: "IELTS",
      accessScope: "class",
      classId: "class-1",
      fileAssetId: file.id,
    });
    service.submitLibraryResourceForReview(actor, resource.id);
    service.publishLibraryResource(actor, resource.id);

    expect(service.createLibraryResourceSignedUrl(actor, resource.id, storage, 60).url).toContain("https://files.test");
    expect(() => service.toggleSavedLibraryResource(outsider, resource.id)).toThrow("class_outside_scope");
    expect(() => service.createLibraryResourceSignedUrl(outsider, resource.id, storage, 60)).toThrow(
      "class_outside_scope",
    );
  });
});
