import { describe, expect, it } from "vitest";
import { ContentProcessingError, ContentProcessingWorker } from "../../worker/src/jobs/content-processing/index.js";

describe("content processing worker", () => {
  it("builds metadata and search index documents for library resources", async () => {
    const worker = new ContentProcessingWorker();
    const result = await worker.process({
      organizationId: "org-1",
      fileAssetId: "file-1",
      libraryResourceId: "resource-1",
      storageKey: "org-1/library/grammar.pdf",
      mimeType: "application/pdf",
      checksumSha256: "checksum-1",
      operations: ["virus_scan", "metadata_extract", "search_index"],
      requestedByUserId: "teacher-1",
    });

    expect(result.completedOperations).toEqual(["virus_scan", "metadata_extract", "search_index"]);
    expect(result.metadata).toMatchObject({ extension: "pdf", processingVersion: 1 });
    expect(result.indexDocument).toMatchObject({
      organizationId: "org-1",
      resourceId: "resource-1",
      kind: "library_resource",
      mimeType: "application/pdf",
    });
  });

  it("rejects invalid content processing jobs", async () => {
    const worker = new ContentProcessingWorker();
    await expect(
      worker.process({
        organizationId: "org-1",
        fileAssetId: "",
        storageKey: "file.pdf",
        mimeType: "application/pdf",
        checksumSha256: "checksum-1",
        operations: ["metadata_extract"],
        requestedByUserId: "teacher-1",
      }),
    ).rejects.toThrow(new ContentProcessingError("invalid_job"));
  });
});
