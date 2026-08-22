export type ContentProcessingOperation =
  "virus_scan" | "metadata_extract" | "thumbnail" | "transcript_index" | "search_index";

export type ContentProcessingJobPayload = {
  organizationId: string;
  fileAssetId: string;
  storageKey: string;
  mimeType: string;
  checksumSha256: string;
  operations: ContentProcessingOperation[];
  requestedByUserId: string;
  contentId?: string;
  libraryResourceId?: string;
};

export type ContentProcessingResult = {
  fileAssetId: string;
  completedOperations: ContentProcessingOperation[];
  metadata: Record<string, string | number | boolean>;
  searchText: string;
  indexDocument: {
    organizationId: string;
    resourceId: string;
    title: string;
    kind: string;
    mimeType: string;
    checksumSha256: string;
    text: string;
  };
};

export type ContentProcessingAdapter = {
  extractMetadata(payload: ContentProcessingJobPayload): Promise<Record<string, string | number | boolean>>;
  extractSearchText(payload: ContentProcessingJobPayload): Promise<string>;
};

export class DeterministicContentProcessingAdapter implements ContentProcessingAdapter {
  async extractMetadata(payload: ContentProcessingJobPayload): Promise<Record<string, string | number | boolean>> {
    const extension = payload.storageKey.split(".").pop()?.toLowerCase() ?? "unknown";
    return {
      extension,
      mimeType: payload.mimeType,
      checksumSha256: payload.checksumSha256,
      processingVersion: 1,
    };
  }

  async extractSearchText(payload: ContentProcessingJobPayload): Promise<string> {
    return [payload.storageKey, payload.mimeType, payload.contentId, payload.libraryResourceId]
      .filter(Boolean)
      .join(" ");
  }
}

export class ContentProcessingError extends Error {
  constructor(public readonly code: "invalid_job" | "unsupported_operation") {
    super(code);
  }
}

export class ContentProcessingWorker {
  constructor(private readonly adapter: ContentProcessingAdapter = new DeterministicContentProcessingAdapter()) {}

  async process(payload: ContentProcessingJobPayload): Promise<ContentProcessingResult> {
    this.validate(payload);
    const metadata = await this.adapter.extractMetadata(payload);
    const searchText = await this.adapter.extractSearchText(payload);
    const resourceId = payload.libraryResourceId ?? payload.contentId ?? payload.fileAssetId;
    return {
      fileAssetId: payload.fileAssetId,
      completedOperations: [...payload.operations],
      metadata,
      searchText,
      indexDocument: {
        organizationId: payload.organizationId,
        resourceId,
        title: payload.storageKey.split("/").at(-1) ?? payload.storageKey,
        kind: payload.libraryResourceId ? "library_resource" : payload.contentId ? "learning_content" : "file_asset",
        mimeType: payload.mimeType,
        checksumSha256: payload.checksumSha256,
        text: searchText,
      },
    };
  }

  private validate(payload: ContentProcessingJobPayload): void {
    if (
      !payload.organizationId ||
      !payload.fileAssetId ||
      !payload.storageKey ||
      !payload.mimeType ||
      !payload.checksumSha256 ||
      !payload.requestedByUserId ||
      !payload.operations.length
    ) {
      throw new ContentProcessingError("invalid_job");
    }
    const supported: ReadonlySet<ContentProcessingOperation> = new Set([
      "virus_scan",
      "metadata_extract",
      "thumbnail",
      "transcript_index",
      "search_index",
    ]);
    if (payload.operations.some((operation) => !supported.has(operation))) {
      throw new ContentProcessingError("unsupported_operation");
    }
  }
}
