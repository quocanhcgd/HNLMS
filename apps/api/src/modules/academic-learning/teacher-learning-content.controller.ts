import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { demoStudentLearningOutputRepository } from "./in-memory-student-learning-output-repository";
import { ensureLearningOutputLoaded, persistLearningOutput } from "./durable-workflow-state";

type HeaderMap = Record<string, string | string[] | undefined>;
function value(headers: HeaderMap, key: string) {
  const raw = headers[key];
  return Array.isArray(raw) ? raw[0] ?? "" : String(raw ?? "");
}
function requireTeacher(headers: HeaderMap) {
  if (!value(headers, "x-user-id")) throw new BadRequestException("teacher_identity_required");
  return value(headers, "x-organization-id") || "org-1";
}

@Controller("teacher/learning")
export class TeacherLearningContentController {
  @Get("materials")
  async listMaterials(@Headers() headers: HeaderMap, @Query("classId") classId?: string) {
    const organizationId = requireTeacher(headers);
    if (!classId?.trim()) throw new BadRequestException("material_class_required");
    await ensureLearningOutputLoaded(organizationId);
    return demoStudentLearningOutputRepository.listMaterials({ organizationId, classIds: new Set([classId.trim()]), programIds: new Set() });
  }

  @Post("materials")
  async createMaterial(@Headers() headers: HeaderMap, @Body() body: { classId?: string; programId?: string; sessionId?: string; title?: string; contentType?: string; source?: string; locale?: string; estimatedDurationMinutes?: number; publicationStatus?: "draft" | "published" }) {
    const organizationId = requireTeacher(headers);
    if (!body?.classId?.trim() || !body?.title?.trim() || !body?.contentType?.trim()) throw new BadRequestException("material_class_title_type_required");
    await ensureLearningOutputLoaded(organizationId);
    const record = {
      organizationId,
      id: `material-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: body.title.trim(),
      contentType: body.contentType.trim(),
      version: 1,
      locale: body.locale?.trim() || "vi",
      publishedAt: new Date().toISOString(),
      estimatedDurationMinutes: body.estimatedDurationMinutes,
      publicationStatus: body.publicationStatus === "published" ? "published" as const : "draft" as const,
      classId: body.classId.trim(),
      programId: body.programId?.trim(),
      sessionId: body.sessionId?.trim(),
      source: body.source?.trim(),
    };
    const created = await demoStudentLearningOutputRepository.addMaterial(record);
    await persistLearningOutput(organizationId);
    return created;
  }

  @Post("materials/:id/publish")
  async publishMaterial(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const organizationId = requireTeacher(headers);
    await ensureLearningOutputLoaded(organizationId);
    const updated = await demoStudentLearningOutputRepository.updateMaterialPublication({ organizationId, id, publicationStatus: "published", publishedAt: new Date().toISOString() });
    if (!updated) throw new BadRequestException("material_not_found");
    await persistLearningOutput(organizationId);
    return updated;
  }

  @Patch("materials/:id")
  async updateMaterial(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { title?: string; contentType?: string; source?: string; sessionId?: string; estimatedDurationMinutes?: number }) {
    const organizationId = requireTeacher(headers);
    if (!body?.title?.trim() || !body?.contentType?.trim()) throw new BadRequestException("material_title_type_required");
    await ensureLearningOutputLoaded(organizationId);
    const updated = await demoStudentLearningOutputRepository.updateMaterial({
      organizationId,
      id,
      changes: {
        title: body.title.trim(),
        contentType: body.contentType.trim(),
        ...(body.source === undefined ? {} : { source: body.source.trim() }),
        ...(body.sessionId === undefined ? {} : { sessionId: body.sessionId.trim() }),
        ...(body.estimatedDurationMinutes === undefined ? {} : { estimatedDurationMinutes: body.estimatedDurationMinutes }),
      },
    });
    if (!updated) throw new BadRequestException("material_not_found");
    await persistLearningOutput(organizationId);
    return updated;
  }

  @Post("scores")
  async createScore(@Headers() headers: HeaderMap, @Body() body: { enrollmentId?: string; assessmentId?: string; title?: string; score?: number; maxScore?: number; weight?: number; publicationStatus?: "draft" | "published" }) {
    const organizationId = requireTeacher(headers);
    await ensureLearningOutputLoaded(organizationId);
    const score = Number(body?.score); const maxScore = Number(body?.maxScore);
    if (!body?.enrollmentId?.trim() || !body?.title?.trim() || !Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore) throw new BadRequestException("score_input_invalid");
    const record = { organizationId, enrollmentId: body.enrollmentId.trim(), id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, assessmentId: body.assessmentId?.trim() || `assessment-${Date.now()}`, title: body.title.trim(), score, maxScore, weight: body.weight, recordedAt: new Date().toISOString(), publicationStatus: body.publicationStatus === "published" ? "published" as const : "draft" as const };
    const created = await demoStudentLearningOutputRepository.addScore(record);
    await persistLearningOutput(organizationId);
    return created;
  }
}
