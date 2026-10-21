import { BadRequestException, Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { configuredAppStateStore } from "../../database/app-state";

type HeaderMap = Record<string, string | string[] | undefined>;
type SessionStatus = "Cần chuẩn bị" | "Sẵn sàng" | "Đã điểm danh" | "Đã xác nhận";
type Session = { id: string; date: string; time: string; className: string; title: string; students: number; materials: number; attendance: number; status: SessionStatus; worklog: "Chưa gửi" | "Đã gửi"; materialAttachmentName?: string; worklogNote?: string };

const seedSessions: Session[] = [
  { id: "session-4", date: "27/08/2026", time: "19:45 - 21:15", className: "TOEIC-2609", title: "Mini test review", students: 16, materials: 5, attendance: 14, status: "Đã điểm danh", worklog: "Chưa gửi" },
  { id: "session-5", date: "28/08/2026", time: "18:00 - 19:30", className: "IF-2609", title: "Listening clinic · Unit 5", students: 18, materials: 4, attendance: 0, status: "Cần chuẩn bị", worklog: "Chưa gửi" },
  { id: "session-3", date: "26/08/2026", time: "17:00 - 18:30", className: "IA-2610", title: "Speaking practice", students: 12, materials: 5, attendance: 12, status: "Đã xác nhận", worklog: "Đã gửi" },
  { id: "session-2", date: "25/08/2026", time: "18:00 - 19:30", className: "IF-2609", title: "Grammar in context", students: 18, materials: 5, attendance: 18, status: "Đã xác nhận", worklog: "Đã gửi" },
];
const sessionsByActor = new Map<string, Session[]>();
const loadedActors = new Set<string>();
const sessionsFor = (userId: string) => {
  const existing = sessionsByActor.get(userId);
  if (existing) return existing;
  const created = structuredClone(seedSessions);
  sessionsByActor.set(userId, created);
  return created;
};

async function ensureSessionsLoaded(userId: string): Promise<void> {
  if (loadedActors.has(userId)) return;
  loadedActors.add(userId);
  const store = configuredAppStateStore();
  if (!store) return;
  try {
    const saved = await store.read<Session[]>("org-1", "teacher-operations", `sessions:${userId}`);
    if (saved) {
      sessionsByActor.set(userId, structuredClone(saved));
      return;
    }
    await store.write("org-1", "teacher-operations", `sessions:${userId}`, sessionsFor(userId));
  } catch {
    // Keep the in-memory demo state available when the optional DB is down.
  }
}

async function persistSessions(userId: string): Promise<void> {
  const store = configuredAppStateStore();
  if (!store) return;
  try { await store.write("org-1", "teacher-operations", `sessions:${userId}`, sessionsFor(userId)); } catch { /* demo fallback */ }
}

function actor(headers: HeaderMap) {
  const value = headers["x-user-id"];
  return Array.isArray(value) ? value[0] ?? "teacher-demo" : String(value ?? "teacher-demo");
}

@Controller("teacher/operations")
export class TeacherClassOperationsController {
  @Get("sessions")
  async list(@Headers() headers: HeaderMap) {
    const userId = actor(headers);
    if (!userId) throw new BadRequestException("teacher_identity_required");
    await ensureSessionsLoaded(userId);
    return sessionsFor(userId);
  }

  @Post("sessions/:id/materials")
  async saveMaterials(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { title?: string; type?: string; description?: string; attachmentName?: string }) {
    await ensureSessionsLoaded(actor(headers));
    const userId = actor(headers);
    const result = this.update(userId, id, (session) => {
      if (!body?.title?.trim()) throw new BadRequestException("material_title_required");
      session.materials = Math.max(session.materials, 5);
      session.status = session.status === "Cần chuẩn bị" ? "Sẵn sàng" : session.status;
      session.materialAttachmentName = body.attachmentName;
    });
    await persistSessions(userId);
    return result;
  }

  @Post("sessions/:id/attendance")
  async saveAttendance(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { attendance?: number }) {
    const userId = actor(headers);
    await ensureSessionsLoaded(userId);
    const result = this.update(userId, id, (session) => {
      const attendance = Number(body?.attendance);
      if (!Number.isInteger(attendance) || attendance < 0 || attendance > session.students) throw new BadRequestException("attendance_invalid");
      session.attendance = attendance;
      if (session.materials >= 5) session.status = "Đã điểm danh";
    });
    await persistSessions(userId);
    return result;
  }

  @Post("sessions/:id/worklog")
  async saveWorklog(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { note?: string }) {
    const userId = actor(headers);
    await ensureSessionsLoaded(userId);
    const result = this.update(userId, id, (session) => {
      if (!body?.note?.trim()) throw new BadRequestException("worklog_note_required");
      if (session.status === "Cần chuẩn bị") throw new BadRequestException("materials_required_before_worklog");
      if (session.attendance === 0) throw new BadRequestException("attendance_required_before_worklog");
      session.worklog = "Đã gửi";
      session.status = "Đã xác nhận";
      session.worklogNote = body.note.trim();
    });
    await persistSessions(userId);
    return result;
  }

  private update(userId: string, id: string, callback: (session: Session) => void) {
    const session = sessionsFor(userId).find((item) => item.id === id);
    if (!session) throw new BadRequestException("session_not_found");
    callback(session);
    return session;
  }
}
