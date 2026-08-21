export type AdmissionStatus =
  "new" | "contacted" | "consulting" | "awaiting_assessment" | "class_proposed" | "enrolled" | "disqualified";

export type ConsultationEntry = {
  id: string;
  kind: "consultation" | "assignment" | "assessment" | "conversion";
  title: string;
  detail: string;
  occurredAt: string;
  author: string;
};

export type ConsultantLead = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  interest: string;
  source: string;
  branch: string;
  owner: string;
  status: AdmissionStatus;
  nextAction: string;
  nextActionAt: string;
  duplicateWarning?: string;
  assessment?: string;
  timeline: ConsultationEntry[];
};

export type ConsultationDraft = {
  notes: string;
  outcome: string;
  nextAction: string;
  nextActionAt: string;
};

export type ConversionDraft = {
  classId: string;
  studentMode: "create" | "link";
  linkedStudentId?: string;
  financeAcknowledged: boolean;
};

export function recordConsultation(
  lead: ConsultantLead,
  draft: ConsultationDraft,
  context: { id: string; now: string; author: string },
): ConsultantLead {
  const notes = draft.notes.trim();
  const nextAction = draft.nextAction.trim();
  if (!notes) throw new Error("consultation_notes_required");
  if (!nextAction || !draft.nextActionAt) throw new Error("next_action_required");
  if (new Date(draft.nextActionAt).getTime() <= new Date(context.now).getTime()) {
    throw new Error("next_action_must_be_future");
  }

  return {
    ...lead,
    status: lead.status === "new" || lead.status === "contacted" ? "consulting" : lead.status,
    nextAction,
    nextActionAt: draft.nextActionAt,
    timeline: [
      {
        id: context.id,
        kind: "consultation",
        title: draft.outcome.trim() || "Đã ghi nhận tư vấn",
        detail: notes,
        occurredAt: context.now,
        author: context.author,
      },
      ...lead.timeline,
    ],
  };
}

export function convertLead(
  lead: ConsultantLead,
  draft: ConversionDraft,
  context: { id: string; now: string; author: string; className: string },
): ConsultantLead {
  if (lead.status !== "class_proposed") throw new Error("lead_not_ready_for_conversion");
  if (!draft.classId) throw new Error("class_required");
  if (draft.studentMode === "link" && !draft.linkedStudentId) throw new Error("student_required");
  if (!draft.financeAcknowledged) throw new Error("finance_acknowledgement_required");

  return {
    ...lead,
    status: "enrolled",
    nextAction: "Bàn giao hồ sơ học viên",
    nextActionAt: context.now,
    timeline: [
      {
        id: context.id,
        kind: "conversion",
        title: `Đã ghi danh ${context.className}`,
        detail:
          draft.studentMode === "create"
            ? "Đã tạo hồ sơ học viên và khởi tạo nghĩa vụ tài chính."
            : "Đã liên kết hồ sơ học viên và khởi tạo nghĩa vụ tài chính.",
        occurredAt: context.now,
        author: context.author,
      },
      ...lead.timeline,
    ],
  };
}
