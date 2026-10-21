export type ConsultantWorkStatus = "Sắp diễn ra" | "Đang diễn ra" | "Đã hoàn tất" | "Thiếu chấm công" | "Chờ điều chỉnh";
export type ConsultantWork = { id: string; date: string; time: string; activity: string; lead: string; channel: string; status: ConsultantWorkStatus; checkIn: string; checkOut: string; note: string; userId: string; organizationId: string };
export type ConsultantLeaveStatus = "Nháp" | "Chờ duyệt" | "Đã duyệt" | "Từ chối" | "Đã hủy";
export type ConsultantLeave = { id: string; type: string; from: string; to: string; days: number; reason: string; status: ConsultantLeaveStatus; submitted: string; userId: string; organizationId: string };
export type ConsultantCommission = { id: string; date: string; lead: string; source: string; conversion: string; commission: number; status: "Đã đối soát" | "Chờ đối soát"; userId: string; organizationId: string };

export type ConsultantActor = { userId: string; organizationId: string; role: string };

export class ConsultantSelfServiceError extends Error {
  constructor(public readonly code: "forbidden" | "not_found" | "invalid_transition" | "invalid_input") { super(code); }
}

export class ConsultantSelfServiceService {
  private readonly work = new Map<string, ConsultantWork[]>();
  private readonly leaves = new Map<string, ConsultantLeave[]>();
  private readonly commissions = new Map<string, ConsultantCommission[]>();

  private assertConsultant(actor: ConsultantActor) {
    const staffRoles = ["organization_admin", "branch_manager", "consultant", "admission_manager", "marketing_manager", "academic_manager", "academic_affairs", "content_reviewer", "support_staff", "finance_officer", "payroll_officer", "hr_officer", "executive", "teacher", "teaching_assistant"]; if (!staffRoles.includes(actor.role) || !actor.userId || !actor.organizationId) throw new ConsultantSelfServiceError("forbidden");
  }
  private key(actor: ConsultantActor) { return `${actor.organizationId}:${actor.userId}`; }
  private ensure(actor: ConsultantActor) {
    this.assertConsultant(actor);
    const key = this.key(actor);
    const owner = { userId: actor.userId, organizationId: actor.organizationId };
    if (!this.work.has(key)) {
      this.work.set(key, actor.role === "branch_manager" ? [
        { id: "work-1", date: "26/08/2026", time: "08:30 - 09:00", activity: "Rà soát vận hành cơ sở", lead: "Đội vận hành Hà Nội", channel: "Tại trung tâm", status: "Sắp diễn ra", checkIn: "", checkOut: "", note: "Kiểm tra lịch lớp, phòng học và các việc cần xử lý trong ngày.", ...owner },
        { id: "work-2", date: "26/08/2026", time: "09:30 - 10:00", activity: "Điều phối lớp và nhân sự", lead: "Học vụ · Nhân sự", channel: "Nội bộ", status: "Đã hoàn tất", checkIn: "09:28", checkOut: "10:02", note: "Đã xác nhận phân công và các thay đổi lịch trong phạm vi cơ sở.", ...owner },
        { id: "work-3", date: "25/08/2026", time: "14:00 - 15:00", activity: "Họp phối hợp liên phòng ban", lead: "Học vụ · Tài chính · Nhân sự", channel: "Nội bộ", status: "Thiếu chấm công", checkIn: "", checkOut: "", note: "Cần bổ sung thời điểm tham dự để đối soát công.", ...owner },
      ] : [
        { id: "work-1", date: "26/08/2026", time: "08:30 - 09:00", activity: "Tư vấn đầu vào", lead: "Nguyễn Minh Anh", channel: "Tại trung tâm", status: "Sắp diễn ra", checkIn: "", checkOut: "", note: "Xác nhận nhu cầu học và lịch phù hợp.", ...owner },
        { id: "work-2", date: "26/08/2026", time: "09:30 - 10:00", activity: "Gọi lại khách tiềm năng", lead: "Trần Gia Hân", channel: "Điện thoại", status: "Đã hoàn tất", checkIn: "09:28", checkOut: "10:02", note: "Đã cập nhật trạng thái lead và lịch hẹn tiếp theo.", ...owner },
        { id: "work-3", date: "25/08/2026", time: "14:00 - 15:00", activity: "Họp bàn giao tuyển sinh", lead: "Bộ phận học vụ", channel: "Nội bộ", status: "Thiếu chấm công", checkIn: "", checkOut: "", note: "Cần bổ sung thời điểm tham dự để đối soát công.", ...owner },
      ]);
      this.leaves.set(key, [{ id: "leave-1", type: "Nghỉ phép năm", from: "02/09/2026", to: "02/09/2026", days: 1, reason: "Việc gia đình", status: "Chờ duyệt", submitted: "25/08/2026", ...owner }, { id: "leave-2", type: "Nghỉ không lương", from: "15/07/2026", to: "15/07/2026", days: 1, reason: "Việc cá nhân", status: "Đã duyệt", submitted: "10/07/2026", ...owner }]);
      this.commissions.set(key, actor.role === "consultant" || actor.role === "admission_manager" ? [{ id: "crm-1", date: "22/08/2026", lead: "Nguyễn Minh Anh", source: "Facebook", conversion: "Ghi danh IELTS Foundation", commission: 450000, status: "Đã đối soát", ...owner }, { id: "crm-2", date: "20/08/2026", lead: "Lê Hoàng Nam", source: "Website", conversion: "Đặt lịch kiểm tra đầu vào", commission: 150000, status: "Chờ đối soát", ...owner }, { id: "crm-3", date: "16/08/2026", lead: "Trần Gia Hân", source: "Giới thiệu", conversion: "Ghi danh TOEIC", commission: 600000, status: "Đã đối soát", ...owner }] : []);
    }
    return key;
  }
  listWork(actor: ConsultantActor) { const key = this.ensure(actor); return structuredClone(this.work.get(key) ?? []); }
  transitionWork(actor: ConsultantActor, id: string, action: "start" | "end" | "adjust", reason?: string) {
    const key = this.ensure(actor); const rows = this.work.get(key) ?? []; const row = rows.find((item) => item.id === id); if (!row) throw new ConsultantSelfServiceError("not_found");
    if (action === "start" && row.status !== "Sắp diễn ra") throw new ConsultantSelfServiceError("invalid_transition");
    if (action === "end" && row.status !== "Đang diễn ra") throw new ConsultantSelfServiceError("invalid_transition");
    if (action === "adjust" && (row.status !== "Thiếu chấm công" || !reason?.trim())) throw new ConsultantSelfServiceError("invalid_input");
    if (action === "start") { row.status = "Đang diễn ra"; row.checkIn = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); }
    if (action === "end") { row.status = "Đã hoàn tất"; row.checkOut = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); }
    if (action === "adjust") { row.status = "Chờ điều chỉnh"; row.note = reason!.trim(); }
    return structuredClone(row);
  }
  listLeaves(actor: ConsultantActor) { const key = this.ensure(actor); return structuredClone(this.leaves.get(key) ?? []); }
  createLeave(actor: ConsultantActor, input: Partial<ConsultantLeave>) {
    const key = this.ensure(actor); if (!input.from || !input.to || !input.reason?.trim() || !Number.isFinite(Number(input.days)) || Number(input.days) <= 0) throw new ConsultantSelfServiceError("invalid_input");
    const row: ConsultantLeave = { id: `leave-${Date.now()}`, type: input.type?.trim() || "Nghỉ phép năm", from: input.from, to: input.to, days: Number(input.days), reason: input.reason.trim(), status: "Chờ duyệt", submitted: new Date().toLocaleDateString("vi-VN"), userId: actor.userId, organizationId: actor.organizationId };
    this.leaves.set(key, [row, ...(this.leaves.get(key) ?? [])]); return structuredClone(row);
  }
  cancelLeave(actor: ConsultantActor, id: string) { const key = this.ensure(actor); const row = (this.leaves.get(key) ?? []).find((item) => item.id === id); if (!row) throw new ConsultantSelfServiceError("not_found"); if (!["Nháp", "Chờ duyệt"].includes(row.status)) throw new ConsultantSelfServiceError("invalid_transition"); row.status = "Đã hủy"; return structuredClone(row); }
  getPayroll(actor: ConsultantActor, period: string) { const key = this.ensure(actor); const commissions = (this.commissions.get(key) ?? []).filter((item) => period === "2026-08" || item.date.includes("07/2026")); return { period, base: 8500000, bonus: period === "2026-08" ? 1000000 : 700000, deduction: period === "2026-08" ? 950000 : 900000, commissions: structuredClone(commissions), leaveBalance: 11 }; }
}
