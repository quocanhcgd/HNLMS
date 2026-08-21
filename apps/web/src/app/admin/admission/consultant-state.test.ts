import { describe, expect, it } from "vitest";
import { convertLead, recordConsultation, type ConsultantLead } from "./consultant-state";

const lead: ConsultantLead = {
  id: "lead-1",
  fullName: "Nguyễn Minh Anh",
  phone: "0900000286",
  email: "minh.anh@example.vn",
  interest: "IELTS 6.5",
  source: "Website",
  branch: "Hà Nội",
  owner: "Lan Anh",
  status: "new",
  nextAction: "Gọi xác nhận nhu cầu",
  nextActionAt: "2026-08-23T02:00:00.000Z",
  timeline: [],
};

describe("T055 consultant workflow", () => {
  it("records an immutable consultation and schedules the next action", () => {
    const result = recordConsultation(
      lead,
      {
        notes: "Khách cần lộ trình 6 tháng.",
        outcome: "Đã xác nhận nhu cầu",
        nextAction: "Gửi lịch thi đầu vào",
        nextActionAt: "2026-08-24T03:00:00.000Z",
      },
      { id: "event-1", now: "2026-08-22T03:00:00.000Z", author: "Lan Anh" },
    );

    expect(result.status).toBe("consulting");
    expect(result.nextAction).toBe("Gửi lịch thi đầu vào");
    expect(result.timeline[0]).toMatchObject({ id: "event-1", kind: "consultation" });
    expect(lead.timeline).toHaveLength(0);
  });

  it("requires notes and a future next action", () => {
    expect(() =>
      recordConsultation(
        lead,
        { notes: "", outcome: "", nextAction: "Gọi lại", nextActionAt: "2026-08-24T03:00:00.000Z" },
        { id: "event-1", now: "2026-08-22T03:00:00.000Z", author: "Lan Anh" },
      ),
    ).toThrow("consultation_notes_required");
    expect(() =>
      recordConsultation(
        lead,
        { notes: "Đã gọi", outcome: "", nextAction: "Gọi lại", nextActionAt: "2026-08-21T03:00:00.000Z" },
        { id: "event-1", now: "2026-08-22T03:00:00.000Z", author: "Lan Anh" },
      ),
    ).toThrow("next_action_must_be_future");
  });

  it("converts only a class-proposed lead with finance acknowledgement", () => {
    const proposed = { ...lead, status: "class_proposed" as const };
    const result = convertLead(
      proposed,
      { classId: "class-ielts-01", studentMode: "create", financeAcknowledged: true },
      { id: "event-2", now: "2026-08-22T04:00:00.000Z", author: "Lan Anh", className: "IELTS F01" },
    );

    expect(result.status).toBe("enrolled");
    expect(result.timeline[0]?.detail).toContain("nghĩa vụ tài chính");
    expect(() =>
      convertLead(
        proposed,
        { classId: "class-ielts-01", studentMode: "create", financeAcknowledged: false },
        { id: "event-3", now: "2026-08-22T04:00:00.000Z", author: "Lan Anh", className: "IELTS F01" },
      ),
    ).toThrow("finance_acknowledgement_required");
  });
});
