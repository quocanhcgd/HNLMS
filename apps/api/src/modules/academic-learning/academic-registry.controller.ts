import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { createDatabase } from "../../database/client";
import { DrizzleAcademicRegistryRepository, isUuid, type AcademicRegistrySection, type ScheduleInput } from "./drizzle-academic-registry-repository";

type HeaderMap = Record<string, string | string[] | undefined>;
type RegistrySection = "programs" | "classes" | "students" | "assignments";
type RegistryRow = Record<string, string | number>;
const header = (headers: HeaderMap, key: string) => {
  const value = headers[key];
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "");
};
const values = (headers: HeaderMap, key: string) => new Set(header(headers, key).split(",").map((item) => item.trim()).filter(Boolean));

const rows: Record<RegistrySection, RegistryRow[]> = {
  programs: [
    { id: "program-english", branchId: "b1", code: "DEMO-ENGLISH", name: "Ngoại ngữ", subject: "Tiếng Anh", department: "Ngoại ngữ", level: "Nền tảng → nâng cao", moduleCount: 8, competencyCount: 4, status: "published" },
    { id: "program-math", branchId: "b1", code: "DEMO-MATH", name: "Toán", subject: "Toán", department: "Khoa học tự nhiên", level: "THCS", moduleCount: 6, competencyCount: 3, status: "published" },
  ],
  classes: [
    { id: "class-if-2609", branchId: "b1", code: "IF-2609", name: "IELTS Foundation", subject: "Tiếng Anh", schedule: "T3 · T5 · 18:00", learners: 18, capacity: 24, modality: "onsite", status: "Đang học" },
    { id: "class-toeic-cg", branchId: "b2", code: "TOEIC-CG-01", name: "TOEIC mục tiêu 700", subject: "Tiếng Anh", schedule: "T2 · T4 · 19:00", learners: 22, capacity: 24, modality: "onsite", status: "Đang học" },
  ],
  students: [
    { id: "student-001", branchId: "b1", code: "HV-001", name: "Nguyễn Minh Anh", classId: "class-if-2609", className: "IELTS Foundation", progress: 68, status: "Đang học" },
    { id: "student-002", branchId: "b2", code: "HV-002", name: "Trần Hoàng Nam", classId: "class-toeic-cg", className: "TOEIC mục tiêu 700", progress: 42, status: "Đang học" },
  ],
  assignments: [
    { id: "assignment-001", branchId: "b1", classId: "class-if-2609", employeeId: "employee-lan-anh", employeeCode: "GV-001", className: "IELTS Foundation", teacher: "Lan Anh", subject: "Tiếng Anh", role: "teacher", sessions: 24, status: "Đang phụ trách" },
    { id: "assignment-002", branchId: "b2", classId: "class-toeic-cg", employeeId: "employee-minh-tuan", employeeCode: "GV-002", className: "TOEIC mục tiêu 700", teacher: "Minh Tuấn", subject: "Tiếng Anh", role: "teacher", sessions: 18, status: "Đang phụ trách" },
  ],
};
const scheduleFromBody = (body: Record<string, unknown>): ScheduleInput | undefined => {
  const raw = body.schedule && typeof body.schedule === "object" ? body.schedule as Record<string, unknown> : body;
  if (raw.weekday === undefined && raw.startsAt === undefined && raw.endsAt === undefined) return undefined;
  return {
    id: raw.id === undefined ? undefined : String(raw.id),
    weekday: Number(raw.weekday),
    startsAt: String(raw.startsAt ?? ""),
    endsAt: String(raw.endsAt ?? ""),
    roomId: raw.roomId == null ? null : String(raw.roomId),
    teacherUserId: raw.teacherUserId == null ? null : String(raw.teacherUserId),
    onlineSessionKey: raw.onlineSessionKey == null ? null : String(raw.onlineSessionKey),
    status: raw.status as ScheduleInput["status"],
  };
};

@Controller("academic/registry")
export class AcademicRegistryController {
  private readonly repository = process.env.DATABASE_URL ? (() => { try { return new DrizzleAcademicRegistryRepository(createDatabase({ url: process.env.DATABASE_URL }).db); } catch { return undefined; } })() : undefined;
  @Get()
  async list(@Headers() headers: HeaderMap, @Query("section") section: string = "classes") {
    const role = header(headers, "x-role");
    const organizationId = header(headers, "x-organization-id");
    const assigned = values(headers, "x-branch-ids");
    const isOrganizationWide = ["organization_admin", "academic_manager", "academic_affairs"].includes(role);
    if (!organizationId || (!isOrganizationWide && !assigned.size)) throw new ForbiddenException("branch_scope_required");
    if (!(section in rows)) throw new ForbiddenException("registry_section_not_allowed");
    const requestedBranch = header(headers, "x-branch-id");
    if (requestedBranch && !isOrganizationWide && !assigned.has(requestedBranch)) throw new ForbiddenException("branch_scope_denied");
    if (this.repository && isUuid(organizationId) && (section === "classes" || section === "students" || section === "assignments")) return { data: await this.repository.list(organizationId, section as AcademicRegistrySection, isOrganizationWide ? undefined : assigned), scope: isOrganizationWide ? "organization" : [...assigned] };
    const scoped = rows[section as RegistrySection].filter((row) => isOrganizationWide || assigned.has(String(row.branchId)));
    return { data: scoped, scope: isOrganizationWide ? "organization" : [...assigned] };
  }

  private actor(headers: HeaderMap) {
    const role = header(headers, "x-role");
    const organizationId = header(headers, "x-organization-id");
    const assigned = values(headers, "x-branch-ids");
    const organizationWide = ["organization_admin", "academic_manager", "academic_affairs"].includes(role);
    if (!organizationId || (!organizationWide && !assigned.size)) throw new ForbiddenException("branch_scope_required");
    return { organizationId, userId: header(headers, "x-user-id") || "demo", assigned, organizationWide };
  }

  @Get("options")
  async options(@Headers() headers: HeaderMap) {
    const actor = this.actor(headers);
    if (this.repository && isUuid(actor.organizationId)) {
      return { data: await this.repository.options(actor.organizationId, actor.organizationWide ? undefined : actor.assigned), scope: actor.organizationWide ? "organization" : [...actor.assigned] };
    }
    const scopedClasses = rows.classes.filter((row) => actor.organizationWide || actor.assigned.has(String(row.branchId)));
    const scopedBranches = [...new Set(scopedClasses.map((row) => String(row.branchId)))].map((id) => ({ id, name: id === "b1" ? "Cầu Giấy" : "Hai Bà Trưng" }));
    return {
      data: {
        courses: scopedClasses.map((row) => ({ id: `course-${row.id}`, code: String(row.code), name: String(row.subject) })),
        classes: scopedClasses.map((row) => ({ id: row.id, code: String(row.code), name: String(row.name), branchId: String(row.branchId), status: "open" })),
        employees: rows.assignments.filter((row) => actor.organizationWide || actor.assigned.has(String(row.branchId))).map((row) => ({ id: String(row.employeeId ?? `employee-${row.id}`), employeeCode: String(row.employeeCode ?? row.id), jobTitle: String(row.teacher ?? row.owner ?? "Giảng viên"), branchId: String(row.branchId), status: "active" })),
        branches: scopedBranches,
      },
      scope: actor.organizationWide ? "organization" : [...actor.assigned],
    };
  }

  @Post(":section")
  async create(@Headers() headers: HeaderMap, @Param("section") section: string, @Body() body: Record<string, unknown>) {
    const actor = this.actor(headers);
    if (section === "programs" || !this.repository || !isUuid(actor.organizationId)) return this.createDemoRecord(section, headers, body);
    try {
      if (section === "classes") {
        const branchId = String(body.branchId ?? header(headers, "x-branch-id"));
        if (!isUuid(branchId) || (!actor.organizationWide && !actor.assigned.has(branchId))) throw new ForbiddenException("branch_scope_denied");
        return await this.repository.createClass({ id: crypto.randomUUID(), organizationId: actor.organizationId, userId: actor.userId, branchId, courseId: String(body.courseId), code: String(body.code), name: String(body.name), modality: (body.modality as "onsite" | "online" | "hybrid") ?? "onsite", capacity: Number(body.capacity), schedule: scheduleFromBody(body) });
      }
      if (section === "students") {
        const classId = String(body.classId);
        const classRows = await this.repository.list(actor.organizationId, "classes", actor.organizationWide ? undefined : actor.assigned);
        const classRow = classRows.find((item) => item.id === classId);
        if (!classRow) throw new ForbiddenException("branch_scope_denied");
        return await this.repository.createStudent({ id: crypto.randomUUID(), organizationId: actor.organizationId, userId: actor.userId, studentCode: String(body.studentCode), fullName: String(body.fullName), classId, enrollmentCode: String(body.enrollmentCode ?? `ENR-${Date.now()}`) });
      }
      if (section === "assignments") return await this.repository.createAssignment({ id: crypto.randomUUID(), organizationId: actor.organizationId, userId: actor.userId, branchIds: actor.organizationWide ? undefined : actor.assigned, employeeId: String(body.employeeId), classId: String(body.classId), role: String(body.role ?? "teacher"), weeklyHours: Number(body.weeklyHours ?? 0), startsAt: new Date(String(body.startsAt ?? new Date().toISOString())) });
      throw new BadRequestException("registry_section_not_allowed");
    } catch (error) { if (error instanceof ForbiddenException || error instanceof BadRequestException) throw error; throw new BadRequestException(error instanceof Error ? error.message : "academic_create_failed"); }
  }

  @Patch(":section/:id")
  async update(@Headers() headers: HeaderMap, @Param("section") section: string, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    const actor = this.actor(headers);
    if (section === "programs" || !this.repository || !isUuid(actor.organizationId)) return this.updateDemoRecord(section, id, body, headers);
    if (!isUuid(id)) throw new BadRequestException("persistent_academic_store_required");
    try {
      const input = { id, organizationId: actor.organizationId, userId: actor.userId, branchIds: actor.organizationWide ? undefined : actor.assigned };
      if (section === "classes") return await this.repository.updateClass({ ...input, name: body.name === undefined ? undefined : String(body.name), code: body.code === undefined ? undefined : String(body.code), capacity: body.capacity === undefined ? undefined : Number(body.capacity), status: body.status as never, schedule: scheduleFromBody(body) });
      if (section === "students") return await this.repository.updateStudent({ ...input, fullName: body.fullName === undefined ? undefined : String(body.fullName), displayName: body.displayName === undefined ? undefined : String(body.displayName), status: body.status as never });
      if (section === "assignments") return await this.repository.updateAssignment({ ...input, weeklyHours: body.weeklyHours === undefined ? undefined : Number(body.weeklyHours), role: body.role === undefined ? undefined : String(body.role), status: body.status as never });
      throw new BadRequestException("registry_section_not_allowed");
    } catch (error) { if (error instanceof ForbiddenException || error instanceof BadRequestException) throw error; throw new BadRequestException(error instanceof Error ? error.message : "academic_update_failed"); }
  }

  @Delete(":section/:id")
  async archive(@Headers() headers: HeaderMap, @Param("section") section: string, @Param("id") id: string) {
    const actor = this.actor(headers);
    if (section === "programs" || !this.repository || !isUuid(actor.organizationId)) return this.archiveDemoRecord(section, id, headers);
    if (!isUuid(id)) throw new BadRequestException("persistent_academic_store_required");
    const input = { id, organizationId: actor.organizationId, userId: actor.userId, branchIds: actor.organizationWide ? undefined : actor.assigned };
    try { if (section === "classes") return await this.repository.archiveClass(input); if (section === "students") return await this.repository.archiveStudent(input); if (section === "assignments") return await this.repository.archiveAssignment(input); throw new BadRequestException("registry_section_not_allowed"); } catch (error) { if (error instanceof ForbiddenException || error instanceof BadRequestException) throw error; throw new BadRequestException(error instanceof Error ? error.message : "academic_archive_failed"); }
  }

  private createDemoRecord(section: string, headers: HeaderMap, body: Record<string, unknown>) {
    if (!(section in rows)) throw new BadRequestException("registry_section_not_allowed");
    const branchId = String(body.branchId ?? (header(headers, "x-branch-id") || "b1"));
    const role = header(headers, "x-role");
    const assigned = values(headers, "x-branch-ids");
    const organizationWide = ["organization_admin", "academic_manager", "academic_affairs"].includes(role);
    if (!organizationWide && (!assigned.size || !assigned.has(branchId))) throw new ForbiddenException("branch_scope_denied");
    if (section === "programs") {
      const code = String(body.code ?? "").trim();
      const name = String(body.name ?? "").trim();
      if (!code || !name) throw new BadRequestException("program_code_and_name_required");
      if (rows.programs.some((item) => String(item.code).toLowerCase() === code.toLowerCase())) throw new BadRequestException("program_code_already_exists");
      const item = { id: `program-${crypto.randomUUID()}`, branchId, code, name, subject: String(body.subject ?? "Chưa phân loại"), department: String(body.department ?? "Đào tạo"), level: String(body.level ?? "Theo cấu hình"), moduleCount: Number(body.moduleCount ?? 0), competencyCount: Number(body.competencyCount ?? 0), status: String(body.status ?? "draft") };
      rows.programs.unshift(item);
      return item;
    }
    if (section === "classes") {
      const code = String(body.code ?? "").trim();
      const name = String(body.name ?? "").trim();
      const capacity = Number(body.capacity);
      if (!code || !name || !Number.isInteger(capacity) || capacity < 1) throw new BadRequestException("class_details_invalid");
      if (rows.classes.some((item) => String(item.code).toLowerCase() === code.toLowerCase())) throw new BadRequestException("class_code_already_exists");
      const course = String(body.courseId ?? "").replace(/^course-/, "");
      const item = { id: `class-${crypto.randomUUID()}`, branchId, code, name, subject: course || "Chưa phân loại", schedule: body.schedule ? `T${Number((body.schedule as Record<string, unknown>).weekday)} · ${String((body.schedule as Record<string, unknown>).startsAt)}-${String((body.schedule as Record<string, unknown>).endsAt)}` : "Chưa xếp lịch", learners: 0, capacity, modality: String(body.modality ?? "onsite"), status: "open" };
      rows.classes.unshift(item);
      return item;
    }
    if (section === "students") {
      const classId = String(body.classId ?? "");
      const academicClass = rows.classes.find((item) => item.id === classId);
      const code = String(body.studentCode ?? "").trim();
      const name = String(body.fullName ?? "").trim();
      if (!academicClass) throw new BadRequestException("class_not_found");
      if (!code || !name) throw new BadRequestException("student_details_invalid");
      if (Number(academicClass.learners) >= Number(academicClass.capacity)) throw new BadRequestException("capacity_exceeded");
      if (rows.students.some((item) => String(item.code).toLowerCase() === code.toLowerCase())) throw new BadRequestException("student_code_already_exists");
      academicClass.learners = Number(academicClass.learners) + 1;
      const item = { id: `student-${crypto.randomUUID()}`, branchId: String(academicClass.branchId), classId, code, name, className: String(academicClass.name), progress: 0, status: "active" };
      rows.students.unshift(item);
      return item;
    }
    const classId = String(body.classId ?? "");
    const employeeId = String(body.employeeId ?? "");
    const academicClass = rows.classes.find((item) => item.id === classId);
    if (!academicClass) throw new BadRequestException("class_not_found");
    if (!employeeId) throw new BadRequestException("employee_not_found");
    const weeklyHours = Number(body.weeklyHours ?? 0);
    if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) throw new BadRequestException("invalid_weekly_hours");
    const item = { id: `assignment-${crypto.randomUUID()}`, branchId: String(academicClass.branchId), classId, employeeId, className: String(academicClass.name), teacher: employeeId.replace(/^employee-/, ""), subject: String(academicClass.subject), role: String(body.role ?? "teacher"), sessions: weeklyHours, status: "active" };
    rows.assignments.unshift(item);
    return item;
  }

  private updateDemoRecord(section: string, id: string, body: Record<string, unknown>, headers?: HeaderMap) {
    if (!(section in rows)) throw new BadRequestException("registry_section_not_allowed");
    const item = rows[section as RegistrySection].find((row) => row.id === id);
    if (!item) throw new BadRequestException(`${section.slice(0, -1)}_not_found`);
    if (headers) {
      const role = header(headers, "x-role");
      const assigned = values(headers, "x-branch-ids");
      const organizationWide = ["organization_admin", "academic_manager", "academic_affairs"].includes(role);
      if (!organizationWide && (!assigned.size || !assigned.has(String(item.branchId)))) throw new ForbiddenException("branch_scope_denied");
    }
    Object.entries(body).forEach(([key, value]) => { if (value !== undefined && key !== "id" && key !== "branchId") item[key] = typeof item[key] === "number" ? Number(value) : String(value); });
    return item;
  }

  private archiveDemoRecord(section: string, id: string, headers?: HeaderMap) {
    const item = this.updateDemoRecord(section, id, { status: section === "programs" ? "retired" : section === "assignments" ? "ended" : section === "classes" ? "cancelled" : "archived" }, headers);
    return item;
  }
}
