import type { CompetencyProfileReadModel } from "@hnlms/domain-contracts";
import { randomUUID } from "node:crypto";

export type CompetencyProfileRecord = CompetencyProfileReadModel & {
  privateReviewerNote?: string;
  internalWorklogId?: string;
};

export type CompetencyReviewAction =
  | "save_draft"
  | "confirm_review"
  | "request_support"
  | "request_publication"
  | "approve_publication"
  | "draft"
  | "confirm"
  | "support";

export type CompetencySkillReviewInput = {
  profileId: string;
  current?: string | { label: string; normalizedScore?: number };
  level?: string;
  teacherFeedback?: string;
  feedback?: string;
  confidence?: number;
};

export type CompetencyReviewCommand = {
  action: CompetencyReviewAction;
  profileIds?: string[];
  profileId?: string;
  updates?: CompetencySkillReviewInput[];
  skills?: CompetencySkillReviewInput[];
  note?: string;
  teacherFeedback?: string;
  supportReason?: string;
  expectedVersions?: Record<string, number>;
  occurredAt?: string;
};

export type CompetencyProfileHistoryEntry = {
  historyId: string;
  organizationId: string;
  profileId: string;
  studentId: string;
  action: "draft_saved" | "review_confirmed" | "support_requested" | "publication_requested" | "publication_approved";
  actorUserId: string;
  occurredAt: string;
  version: number;
  reason?: string;
  before: CompetencyProfileRecord;
  after: CompetencyProfileRecord;
};

export type CompetencyProfileActor = {
  userId: string;
  organizationId: string;
  role:
    | "teacher"
    | "teaching_assistant"
    | "staff"
    | "academic_affairs"
    | "academic_manager"
    | "organization_admin"
    | "student"
    | "parent";
  permissions?: ReadonlySet<string>;
  studentId?: string;
  studentIds?: ReadonlySet<string>;
  branchIds?: ReadonlySet<string>;
  classIds?: ReadonlySet<string>;
  subjectIds?: ReadonlySet<string>;
  programIds?: ReadonlySet<string>;
  parentPermissionsByStudentId?: ReadonlyMap<string, ReadonlySet<string>>;
};

export type CompetencyProfileFilters = {
  subjectId?: string;
  programId?: string;
  classId?: string;
  reviewStatus?: CompetencyProfileReadModel["reviewStatus"];
};

export type CompetencyProfileRepository = {
  list(input: { organizationId: string; studentId?: string }): Promise<CompetencyProfileRecord[]>;
  replaceCurrent(input: {
    organizationId: string;
    records: CompetencyProfileRecord[];
  }): Promise<CompetencyProfileRecord[]>;
  appendHistory(input: { entries: CompetencyProfileHistoryEntry[] }): Promise<CompetencyProfileHistoryEntry[]>;
  listHistory(input: { organizationId: string; profileId: string }): Promise<CompetencyProfileHistoryEntry[]>;
  commitReview?(input: {
    organizationId: string;
    records: CompetencyProfileRecord[];
    entries: CompetencyProfileHistoryEntry[];
  }): Promise<void>;
};

export class CompetencyProfileError extends Error {
  constructor(
    public readonly code: "forbidden" | "invalid_input" | string,
    message = code,
  ) {
    super(message);
    this.name = "CompetencyProfileError";
  }
}

function matchesOptionalScope(scope: ReadonlySet<string> | undefined, value: string): boolean {
  return !scope || scope.has(value);
}

function normalizeAction(action: CompetencyReviewAction): CompetencyReviewAction {
  return action === "draft"
    ? "save_draft"
    : action === "confirm"
      ? "confirm_review"
      : action === "support"
        ? "request_support"
        : action;
}

const supportedReviewActions = new Set<CompetencyReviewAction>([
  "save_draft",
  "confirm_review",
  "request_support",
  "request_publication",
  "draft",
  "confirm",
  "support",
]);

function isMissingLevel(value: { label: string }): boolean {
  return (
    !value.label.trim() ||
    ["chưa đánh giá", "chưa có dữ liệu", "chưa cập nhật"].includes(value.label.trim().toLowerCase())
  );
}

function publicProjection(record: CompetencyProfileRecord): CompetencyProfileReadModel {
  const published = structuredClone(record) as Partial<CompetencyProfileRecord>;
  delete published.privateReviewerNote;
  delete published.internalWorklogId;
  return published as CompetencyProfileReadModel;
}

export class CompetencyProfileService {
  constructor(private readonly repository: CompetencyProfileRepository) {}

  private assertReviewActor(actor: CompetencyProfileActor): void {
    if (!["teacher", "teaching_assistant", "staff"].includes(actor.role)) {
      throw new CompetencyProfileError("forbidden", "staff_role_required");
    }
    if (!actor.permissions?.has("competency:read") && !actor.permissions?.has("competency:review")) {
      throw new CompetencyProfileError("forbidden", "competency_review_permission_required");
    }
  }

  private assertPublicationActor(actor: CompetencyProfileActor): void {
    if (!["academic_affairs", "academic_manager", "organization_admin"].includes(actor.role))
      throw new CompetencyProfileError("forbidden", "academic_publication_role_required");
    if (!actor.permissions?.has("competency:publish"))
      throw new CompetencyProfileError("forbidden", "competency_publish_permission_required");
  }

  private assertRecordScope(actor: CompetencyProfileActor, record: CompetencyProfileRecord): void {
    if (
      !matchesOptionalScope(actor.studentIds, record.studentId) ||
      !matchesOptionalScope(actor.branchIds, record.branchId) ||
      !matchesOptionalScope(actor.classIds, record.classId) ||
      !matchesOptionalScope(actor.subjectIds, record.subjectId) ||
      !matchesOptionalScope(actor.programIds, record.programId)
    ) {
      throw new CompetencyProfileError("forbidden", "competency_scope_denied");
    }
  }

  /** Applies one atomic teacher review to every skill in an aggregated profile context. */
  async review(actor: CompetencyProfileActor, command: CompetencyReviewCommand) {
    this.assertReviewActor(actor);
    if (!command || typeof command !== "object" || !supportedReviewActions.has(command.action))
      throw new CompetencyProfileError("invalid_input", "unsupported_review_action");
    const action = normalizeAction(command.action);
    const commandProfileIds = Array.isArray(command.profileIds)
      ? command.profileIds.filter((value): value is string => typeof value === "string")
      : [];
    const requestedIds = [
      ...new Set([...commandProfileIds, ...(typeof command.profileId === "string" ? [command.profileId] : [])]),
    ];
    const updates = Array.isArray(command.updates)
      ? command.updates
      : Array.isArray(command.skills)
        ? command.skills
        : [];
    const ids = [...new Set([...requestedIds, ...updates.map((item) => item.profileId)])];
    if (!ids.length) throw new CompetencyProfileError("invalid_input", "profile_ids_required");
    const allRecords = await this.repository.list({ organizationId: actor.organizationId });
    const selected = allRecords.filter((record) => ids.includes(record.profileId));
    if (selected.length !== ids.length)
      throw new CompetencyProfileError("invalid_input", "competency_profile_not_found");
    selected.forEach((record) => this.assertRecordScope(actor, record));
    const context = selected[0];
    if (
      !context ||
      selected.some(
        (record) =>
          record.studentId !== context.studentId ||
          record.subjectId !== context.subjectId ||
          record.programId !== context.programId ||
          record.classId !== context.classId ||
          record.branchId !== context.branchId,
      )
    ) {
      throw new CompetencyProfileError("invalid_input", "skills_must_share_profile_context");
    }
    const contextRecords = allRecords.filter(
      (record) =>
        record.studentId === context.studentId &&
        record.subjectId === context.subjectId &&
        record.programId === context.programId &&
        record.classId === context.classId &&
        record.branchId === context.branchId,
    );
    if (contextRecords.length !== selected.length || contextRecords.some((record) => !ids.includes(record.profileId))) {
      throw new CompetencyProfileError("invalid_input", "all_profile_skills_required");
    }
    for (const record of selected) {
      const expected = command.expectedVersions?.[record.profileId];
      if (expected !== undefined && expected !== record.version)
        throw new CompetencyProfileError("invalid_input", "competency_profile_version_conflict");
    }
    if (action === "request_publication" && selected.some((record) => record.reviewStatus !== "confirmed")) {
      throw new CompetencyProfileError("invalid_input", "publication_requires_all_reviews_confirmed");
    }
    if (action === "request_publication" && selected.some((record) => record.publicationStatus === "published")) {
      throw new CompetencyProfileError("invalid_input", "publication_already_published");
    }

    const updateById = new Map(updates.map((item) => [item.profileId, item]));
    const now = command.occurredAt ?? new Date().toISOString();
    const historyAction =
      action === "save_draft"
        ? "draft_saved"
        : action === "confirm_review"
          ? "review_confirmed"
          : action === "request_support"
            ? "support_requested"
            : "publication_requested";
    const nextRecords = selected.map((record) => {
      const input = updateById.get(record.profileId);
      const currentInput = input?.current ?? input?.level;
      const current =
        typeof currentInput === "string"
          ? { label: currentInput.trim() }
          : currentInput
            ? {
                label: currentInput.label.trim(),
                ...(currentInput.normalizedScore === undefined
                  ? {}
                  : { normalizedScore: currentInput.normalizedScore }),
              }
            : record.current;
      if (!current.label) throw new CompetencyProfileError("invalid_input", "competency_level_required");
      if (
        current.normalizedScore !== undefined &&
        (!Number.isFinite(current.normalizedScore) || current.normalizedScore < 0 || current.normalizedScore > 100)
      )
        throw new CompetencyProfileError("invalid_input", "competency_score_out_of_range");
      const feedback =
        input?.teacherFeedback ?? input?.feedback ?? command.teacherFeedback ?? command.note ?? record.teacherFeedback;
      const confidence = input?.confidence ?? record.confidence;
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100)
        throw new CompetencyProfileError("invalid_input", "competency_confidence_out_of_range");
      const confirmed =
        action === "confirm_review"
          ? "confirmed"
          : action === "request_support"
            ? "needs_support"
            : action === "request_publication"
              ? record.reviewStatus
              : "pending_review";
      const publicationStatus =
        action === "request_publication"
          ? "pending_publication"
          : action === "confirm_review" || action === "save_draft" || action === "request_support"
            ? "draft"
            : record.publicationStatus;
      const version = action === "confirm_review" ? record.version + 1 : record.version;
      const profile = {
        ...record,
        current,
        confidence,
        reviewStatus: confirmed,
        publicationStatus,
        version,
        ...(feedback?.trim() ? { teacherFeedback: feedback.trim() } : {}),
      } as CompetencyProfileRecord;
      if (action === "confirm_review") {
        profile.evidence = {
          sourceType: "teacher_review",
          sourceId: `review-${randomUUID()}`,
          sourceLabel: "Giáo viên rà soát",
          assessedAt: now,
          summary: feedback?.trim() || "Đánh giá năng lực theo dõi trên lớp",
        };
      }
      return profile;
    });
    if (action === "confirm_review" && nextRecords.some((record) => isMissingLevel(record.current)))
      throw new CompetencyProfileError("invalid_input", "all_skill_levels_required");
    const entries = nextRecords.map(
      (after, index) =>
        ({
          historyId: randomUUID(),
          organizationId: actor.organizationId,
          profileId: after.profileId,
          studentId: after.studentId,
          action: historyAction,
          actorUserId: actor.userId,
          occurredAt: now,
          version: after.version,
          ...(command.supportReason || command.note ? { reason: command.supportReason ?? command.note } : {}),
          before: structuredClone(selected[index]!),
          after: structuredClone(after),
        }) satisfies CompetencyProfileHistoryEntry,
    );
    if (this.repository.commitReview) {
      await this.repository.commitReview({ organizationId: actor.organizationId, records: nextRecords, entries });
    } else {
      await this.repository.replaceCurrent({ organizationId: actor.organizationId, records: nextRecords });
      await this.repository.appendHistory({ entries });
    }
    return {
      action,
      context: {
        studentId: context.studentId,
        subjectId: context.subjectId,
        programId: context.programId,
        classId: context.classId,
      },
      profiles: nextRecords.map(publicProjection),
      history: entries.map((entry) => ({
        ...entry,
        before: publicProjection(entry.before),
        after: publicProjection(entry.after),
      })),
    };
  }

  saveDraft(actor: CompetencyProfileActor, command: Omit<CompetencyReviewCommand, "action">) {
    return this.review(actor, { ...command, action: "save_draft" });
  }
  confirmReview(actor: CompetencyProfileActor, command: Omit<CompetencyReviewCommand, "action">) {
    return this.review(actor, { ...command, action: "confirm_review" });
  }
  requestSupport(actor: CompetencyProfileActor, command: Omit<CompetencyReviewCommand, "action">) {
    return this.review(actor, { ...command, action: "request_support" });
  }
  requestPublication(actor: CompetencyProfileActor, command: Omit<CompetencyReviewCommand, "action">) {
    return this.review(actor, { ...command, action: "request_publication" });
  }

  async approvePublication(actor: CompetencyProfileActor, command: Omit<CompetencyReviewCommand, "action">) {
    this.assertPublicationActor(actor);
    const ids = [...new Set([...(command.profileIds ?? []), ...(command.profileId ? [command.profileId] : [])])];
    if (!ids.length) throw new CompetencyProfileError("invalid_input", "profile_ids_required");
    const allRecords = await this.repository.list({ organizationId: actor.organizationId });
    const selected = allRecords.filter((record) => ids.includes(record.profileId));
    if (selected.length !== ids.length)
      throw new CompetencyProfileError("invalid_input", "competency_profile_not_found");
    selected.forEach((record) => this.assertRecordScope(actor, record));
    const context = selected[0];
    if (
      !context ||
      selected.some(
        (record) =>
          record.studentId !== context.studentId ||
          record.subjectId !== context.subjectId ||
          record.programId !== context.programId ||
          record.classId !== context.classId ||
          record.branchId !== context.branchId,
      )
    )
      throw new CompetencyProfileError("invalid_input", "skills_must_share_profile_context");
    const contextRecords = allRecords.filter(
      (record) =>
        record.studentId === context.studentId &&
        record.subjectId === context.subjectId &&
        record.programId === context.programId &&
        record.classId === context.classId &&
        record.branchId === context.branchId,
    );
    if (contextRecords.length !== selected.length || contextRecords.some((record) => !ids.includes(record.profileId)))
      throw new CompetencyProfileError("invalid_input", "all_profile_skills_required");
    if (
      selected.some(
        (record) => record.reviewStatus !== "confirmed" || record.publicationStatus !== "pending_publication",
      )
    )
      throw new CompetencyProfileError("invalid_input", "publication_request_required");
    const now = command.occurredAt ?? new Date().toISOString();
    const nextRecords = selected.map((record) => ({ ...record, publicationStatus: "published" as const }));
    const entries = nextRecords.map(
      (after, index) =>
        ({
          historyId: randomUUID(),
          organizationId: actor.organizationId,
          profileId: after.profileId,
          studentId: after.studentId,
          action: "publication_approved" as const,
          actorUserId: actor.userId,
          occurredAt: now,
          version: after.version,
          ...(command.note ? { reason: command.note } : {}),
          before: structuredClone(selected[index]!),
          after: structuredClone(after),
        }) satisfies CompetencyProfileHistoryEntry,
    );
    if (this.repository.commitReview) {
      await this.repository.commitReview({ organizationId: actor.organizationId, records: nextRecords, entries });
    } else {
      await this.repository.replaceCurrent({ organizationId: actor.organizationId, records: nextRecords });
      await this.repository.appendHistory({ entries });
    }
    return {
      action: "approve_publication" as const,
      context: {
        studentId: context.studentId,
        subjectId: context.subjectId,
        programId: context.programId,
        classId: context.classId,
      },
      profiles: nextRecords.map(publicProjection),
      history: entries.map((entry) => ({
        ...entry,
        before: publicProjection(entry.before),
        after: publicProjection(entry.after),
      })),
    };
  }

  async listHistoryForStaff(actor: CompetencyProfileActor, profileId: string) {
    this.assertReviewActor(actor);
    const record = (await this.repository.list({ organizationId: actor.organizationId })).find(
      (item) => item.profileId === profileId,
    );
    if (!record) throw new CompetencyProfileError("invalid_input", "competency_profile_not_found");
    this.assertRecordScope(actor, record);
    return (await this.repository.listHistory({ organizationId: actor.organizationId, profileId })).map((entry) => ({
      ...entry,
      before: publicProjection(entry.before),
      after: publicProjection(entry.after),
    }));
  }

  async listForStaff(
    actor: CompetencyProfileActor,
    filters: CompetencyProfileFilters & { studentId?: string } = {},
  ): Promise<CompetencyProfileReadModel[]> {
    if (
      ![
        "teacher",
        "teaching_assistant",
        "staff",
        "academic_affairs",
        "academic_manager",
        "organization_admin",
      ].includes(actor.role)
    ) {
      throw new CompetencyProfileError("forbidden", "staff_role_required");
    }
    if (!actor.permissions?.has("competency:read")) {
      throw new CompetencyProfileError("forbidden", "competency_read_permission_required");
    }
    const records = await this.repository.list({ organizationId: actor.organizationId, studentId: filters.studentId });
    return records
      .filter(
        (record) =>
          matchesOptionalScope(actor.studentIds, record.studentId) &&
          matchesOptionalScope(actor.branchIds, record.branchId) &&
          matchesOptionalScope(actor.classIds, record.classId) &&
          matchesOptionalScope(actor.subjectIds, record.subjectId) &&
          matchesOptionalScope(actor.programIds, record.programId) &&
          (!filters.subjectId || record.subjectId === filters.subjectId) &&
          (!filters.programId || record.programId === filters.programId) &&
          (!filters.classId || record.classId === filters.classId) &&
          (!filters.reviewStatus || record.reviewStatus === filters.reviewStatus),
      )
      .map(publicProjection);
  }

  async listForStudent(
    actor: CompetencyProfileActor,
    studentId: string,
    filters: CompetencyProfileFilters = {},
  ): Promise<CompetencyProfileReadModel[]> {
    if (actor.role !== "student" || actor.studentId !== studentId) {
      throw new CompetencyProfileError("forbidden", "student_self_scope_required");
    }
    return this.listPublished(actor, studentId, filters);
  }

  async listForParent(
    actor: CompetencyProfileActor,
    studentId: string,
    filters: CompetencyProfileFilters = {},
  ): Promise<CompetencyProfileReadModel[]> {
    if (actor.role !== "parent" || !actor.parentPermissionsByStudentId?.get(studentId)?.has("view_competency")) {
      throw new CompetencyProfileError("forbidden", "parent_competency_delegation_required");
    }
    return this.listPublished(actor, studentId, filters);
  }

  private async listPublished(
    actor: CompetencyProfileActor,
    studentId: string,
    filters: CompetencyProfileFilters,
  ): Promise<CompetencyProfileReadModel[]> {
    const records = await this.repository.list({ organizationId: actor.organizationId, studentId });
    return records
      .filter(
        (record) =>
          record.publicationStatus === "published" &&
          (!filters.subjectId || record.subjectId === filters.subjectId) &&
          (!filters.programId || record.programId === filters.programId) &&
          (!filters.classId || record.classId === filters.classId) &&
          (!filters.reviewStatus || record.reviewStatus === filters.reviewStatus),
      )
      .map(publicProjection);
  }
}
