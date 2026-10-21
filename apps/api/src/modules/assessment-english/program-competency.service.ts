import { randomUUID } from "node:crypto";
import {
  normalizeCompetencyScore,
  parseProgramCompetencyBlueprint,
  type CompetencyDefinition,
  type ProgramCompetencyBlueprint,
} from "@hnlms/domain-contracts";

export type ProgramCompetencyActor = {
  userId: string;
  organizationId: string;
  canManagePrograms?: boolean;
  subjectIds?: ReadonlySet<string>;
  programIds?: ReadonlySet<string>;
};

export type ProgramCompetencyRepository = {
  listBlueprints(input: { organizationId: string }): Promise<ProgramCompetencyBlueprint[]>;
  findBlueprint(input: { organizationId: string; blueprintId: string; version?: number }): Promise<ProgramCompetencyBlueprint | null>;
  saveBlueprint(input: ProgramCompetencyBlueprint): Promise<ProgramCompetencyBlueprint>;
  publishBlueprint(input: { organizationId: string; blueprintId: string; publishedAt: string }): Promise<ProgramCompetencyBlueprint>;
};

export type ProgramCompetencyAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "program-competency.blueprint-created" | "program-competency.blueprint-published";
  entityId: string;
  after: Record<string, unknown>;
}) => Promise<void>;

export class ProgramCompetencyError extends Error {
  constructor(
    public readonly code: "forbidden" | "not_found" | "invalid_input" | "invalid_status" | string,
    message = code,
  ) {
    super(message);
    this.name = "ProgramCompetencyError";
  }
}

function assertManager(actor: ProgramCompetencyActor): void {
  if (!actor.canManagePrograms) throw new ProgramCompetencyError("forbidden", "program_management_required");
}

function assertScope(actor: ProgramCompetencyActor, blueprint: Pick<ProgramCompetencyBlueprint, "subjectId" | "programId">): void {
  if (actor.subjectIds && !actor.subjectIds.has(blueprint.subjectId)) {
    throw new ProgramCompetencyError("forbidden", "program_subject_scope_denied");
  }
  if (actor.programIds && !actor.programIds.has(blueprint.programId)) {
    throw new ProgramCompetencyError("forbidden", "program_scope_denied");
  }
}

function validateDefinition(definition: CompetencyDefinition): void {
  const { min, max } = definition.scoreScale;
  const policy = definition.normalizationPolicy;
  if (policy.sourceMin !== min || policy.sourceMax !== max) {
    throw new ProgramCompetencyError("invalid_input", "normalization_source_must_match_score_scale");
  }
  for (const criterion of definition.rubric) {
    const weight = criterion.levels.reduce((sum, level) => sum + Math.max(0, level.maxScore - level.minScore), 0);
    if (weight <= 0) throw new ProgramCompetencyError("invalid_input", "rubric_levels_must_have_range");
    if (criterion.levels.some((level) => level.minScore < min || level.maxScore > max)) {
      throw new ProgramCompetencyError("invalid_input", "rubric_level_outside_score_scale");
    }
  }
}

function validateBlueprint(blueprint: ProgramCompetencyBlueprint): void {
  blueprint.competencyDefinitions.forEach(validateDefinition);
  for (const threshold of blueprint.placementThresholds) {
    if (threshold.minScore < 0 || threshold.maxScore < threshold.minScore) {
      throw new ProgramCompetencyError("invalid_input", "placement_threshold_invalid");
    }
  }
  for (const outcome of blueprint.targetOutcomes) {
    const definition = blueprint.competencyDefinitions.find((item) => item.code === outcome.competencyCode);
    if (!definition) throw new ProgramCompetencyError("invalid_input", "target_outcome_competency_not_found");
    if (outcome.targetScore !== undefined && (outcome.targetScore < definition.normalizationPolicy.targetMin || outcome.targetScore > definition.normalizationPolicy.targetMax)) {
      throw new ProgramCompetencyError("invalid_input", "target_outcome_score_out_of_range");
    }
  }
}

export class ProgramCompetencyService {
  constructor(
    private readonly repository: ProgramCompetencyRepository,
    private readonly audit: ProgramCompetencyAudit = async () => undefined,
    private readonly now: () => Date = () => new Date(),
    private readonly newId: () => string = randomUUID,
  ) {}

  async listBlueprints(actor: ProgramCompetencyActor): Promise<ProgramCompetencyBlueprint[]> {
    const blueprints = await this.repository.listBlueprints({ organizationId: actor.organizationId });
    return blueprints
      .filter((blueprint) => !actor.subjectIds || actor.subjectIds.has(blueprint.subjectId))
      .filter((blueprint) => !actor.programIds || actor.programIds.has(blueprint.programId))
      .map((blueprint) => structuredClone(blueprint));
  }

  async getBlueprint(actor: ProgramCompetencyActor, blueprintId: string, version?: number): Promise<ProgramCompetencyBlueprint> {
    const blueprint = await this.repository.findBlueprint({ organizationId: actor.organizationId, blueprintId, version });
    if (!blueprint) throw new ProgramCompetencyError("not_found", "blueprint_not_found");
    assertScope(actor, blueprint);
    return structuredClone(blueprint);
  }

  async createDraft(actor: ProgramCompetencyActor, input: unknown): Promise<ProgramCompetencyBlueprint> {
    assertManager(actor);
    const parsed = parseProgramCompetencyBlueprint(input);
    if (parsed.organizationId !== actor.organizationId) {
      throw new ProgramCompetencyError("forbidden", "blueprint_organization_scope_denied");
    }
    assertScope(actor, parsed);
    if (parsed.status !== "draft") throw new ProgramCompetencyError("invalid_status", "new_blueprint_must_be_draft");
    validateBlueprint(parsed);
    const existing = (await this.repository.listBlueprints({ organizationId: actor.organizationId }))
      .filter((blueprint) => blueprint.subjectId === parsed.subjectId && blueprint.programId === parsed.programId);
    const latestVersion = Math.max(0, ...existing.map((blueprint) => blueprint.version));
    if (parsed.version !== latestVersion + 1) {
      throw new ProgramCompetencyError("invalid_input", "blueprint_version_must_be_next");
    }
    const blueprint = { ...parsed, blueprintId: parsed.blueprintId || this.newId() };
    const saved = await this.repository.saveBlueprint(blueprint);
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "program-competency.blueprint-created",
      entityId: saved.blueprintId,
      after: { subjectId: saved.subjectId, programId: saved.programId, version: saved.version },
    });
    return saved;
  }

  async publishBlueprint(actor: ProgramCompetencyActor, blueprintId: string): Promise<ProgramCompetencyBlueprint> {
    assertManager(actor);
    const blueprint = await this.getBlueprint(actor, blueprintId);
    if (blueprint.status !== "draft") throw new ProgramCompetencyError("invalid_status", "blueprint_must_be_draft");
    validateBlueprint(blueprint);
    const publishedAt = this.now().toISOString();
    const published = await this.repository.publishBlueprint({
      organizationId: actor.organizationId,
      blueprintId,
      publishedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "program-competency.blueprint-published",
      entityId: published.blueprintId,
      after: { status: published.status, version: published.version, publishedAt },
    });
    return published;
  }

  normalizeScore(actor: ProgramCompetencyActor, blueprint: ProgramCompetencyBlueprint, competencyCode: string, rawScore: number): number | string {
    assertScope(actor, blueprint);
    const definition = blueprint.competencyDefinitions.find((item) => item.code === competencyCode);
    if (!definition) throw new ProgramCompetencyError("not_found", "competency_definition_not_found");
    try {
      return normalizeCompetencyScore(rawScore, definition.normalizationPolicy);
    } catch (error) {
      throw new ProgramCompetencyError("invalid_input", error instanceof Error ? error.message : "score_normalization_failed");
    }
  }
}
