import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { CommunicationService } from "./communication.service";
import { InMemoryCommunicationRepository } from "./in-memory-communication-repository";
import { configuredAppStateStore } from "../../database/app-state";

type HeaderMap = Record<string, string | string[] | undefined>;
type CommunicationMode = "teaching" | "internal";

function header(headers: HeaderMap, key: string): string {
  const value = headers[key];
  return Array.isArray(value) ? (value[0] ?? "") : String(value ?? "");
}

function actor(headers: HeaderMap) {
  const rawUserId = header(headers, "x-user-id");
  return {
    userId: rawUserId === "student@demo.hnlms.vn" ? "student-minh-khang" : rawUserId === "parent@demo.hnlms.vn" ? "parent-nguyen-an" : rawUserId || "teacher-demo",
    organizationId: header(headers, "x-organization-id") || "org-1",
  };
}

function seedCommunication(): { repository: InMemoryCommunicationRepository; service: CommunicationService } {
  const repository = new InMemoryCommunicationRepository();
  const service = new CommunicationService(
    repository,
    (kind) => `${kind}-${repository.messages.length + repository.conversations.length + 1}`,
  );
  const owner = { userId: "teacher-demo", organizationId: "org-1" };
  const seeds = [
    {
      id: "teaching-parent-nguyen-an",
      type: "parent_teacher" as const,
      subject: "Tiến độ học tập tuần này",
      relatedClassId: "if-2609",
      relatedStudentId: "student-nguyen-an",
      recipient: "parent-nguyen-an",
      recipientRole: "parent" as const,
      recipientName: "Nguyễn An · Phụ huynh",
      context: "IF-2609 · Listening clinic",
      body: "Cô đã cập nhật nhận xét sau buổi học hôm nay.",
    },
    {
      id: "teaching-student-minh-khang",
      type: "student" as const,
      subject: "Bài tập Reading Unit 5",
      relatedClassId: "toeic-2609",
      relatedStudentId: "student-minh-khang",
      recipient: "student-minh-khang",
      recipientRole: "student" as const,
      recipientName: "Minh Khang · Học viên",
      context: "TOEIC-2609 · Reading",
      body: "Em đã nộp lại bài và đánh dấu phần cần cô xem giúp.",
    },
    {
      id: "internal-academic-if2609",
      type: "internal" as const,
      subject: "Bổ sung học liệu Unit 5",
      relatedClassId: "if-2609",
      recipient: "academic-demo",
      recipientRole: "staff" as const,
      recipientName: "Học vụ",
      context: "Điều phối lớp · IF-2609",
      body: "Học vụ đã ghi nhận checklist trước buổi dạy.",
    },
    {
      id: "internal-support-nguyen-an",
      type: "support" as const,
      subject: "Theo dõi yêu cầu phụ huynh",
      relatedClassId: "if-2609",
      relatedStudentId: "student-nguyen-an",
      recipient: "support-demo",
      recipientRole: "staff" as const,
      recipientName: "CSKH",
      context: "Hỗ trợ học viên · IF-2609",
      body: "CSKH chờ giáo viên xác nhận nội dung phản hồi.",
    },
  ];
  for (const seed of seeds) {
    const conversation = {
      id: seed.id,
      organizationId: owner.organizationId,
      type: seed.type,
      subject: seed.subject,
      ...(seed.relatedClassId ? { relatedClassId: seed.relatedClassId } : {}),
      ...(seed.relatedStudentId ? { relatedStudentId: seed.relatedStudentId } : {}),
      status: "open" as const,
      createdByUserId: owner.userId,
      createdAt: new Date("2026-08-28T08:00:00.000Z").toISOString(),
    };
    repository.conversations.push(conversation);
    repository.conversationMembers.push(
      {
        id: `${seed.id}-owner`,
        organizationId: owner.organizationId,
        conversationId: seed.id,
        userId: owner.userId,
        role: "owner",
        status: "active",
        joinedAt: conversation.createdAt,
        createdByUserId: owner.userId,
      },
      {
        id: `${seed.id}-recipient`,
        organizationId: owner.organizationId,
        conversationId: seed.id,
        userId: seed.recipient,
        role: seed.recipientRole,
        status: "active",
        joinedAt: conversation.createdAt,
        createdByUserId: owner.userId,
      },
    );
    repository.messages.push({
      id: `${seed.id}-message`,
      organizationId: owner.organizationId,
      conversationId: seed.id,
      senderUserId: seed.type === "parent_teacher" ? owner.userId : seed.recipient,
      body: seed.body,
      status: "sent",
      sentAt: "2026-08-28T06:05:00.000Z",
    });
  }
  return { repository, service };
}

const state = seedCommunication();
let communicationLoaded = false;

async function ensureCommunicationLoaded(): Promise<void> {
  if (communicationLoaded) return;
  communicationLoaded = true;
  const store = configuredAppStateStore();
  if (!store) return;
  try {
    const saved = await store.read<{
      conversations: typeof state.repository.conversations;
      conversationMembers: typeof state.repository.conversationMembers;
      messages: typeof state.repository.messages;
    }>("org-1", "communication", "demo");
    if (saved) {
      state.repository.conversations.splice(0, state.repository.conversations.length, ...structuredClone(saved.conversations));
      state.repository.conversationMembers.splice(0, state.repository.conversationMembers.length, ...structuredClone(saved.conversationMembers));
      state.repository.messages.splice(0, state.repository.messages.length, ...structuredClone(saved.messages));
      return;
    }
    await persistCommunication();
  } catch {
    // Communication remains usable in demo mode when DB credentials are absent.
  }
}

async function persistCommunication(): Promise<void> {
  const store = configuredAppStateStore();
  if (!store) return;
  try {
    await store.write("org-1", "communication", "demo", {
      conversations: structuredClone(state.repository.conversations),
      conversationMembers: structuredClone(state.repository.conversationMembers),
      messages: structuredClone(state.repository.messages),
    });
  } catch { /* demo fallback */ }
}

export async function notifyTeacherOfLearningSubmission(input: {
  organizationId: string;
  assignmentId: string;
  assignmentTitle: string;
  classId: string;
  studentId: string;
}): Promise<void> {
  await ensureCommunicationLoaded();
  const conversationId = `learning-submission-${input.assignmentId}-${input.studentId}`;
  if (state.repository.conversations.some((conversation) => conversation.id === conversationId)) return;
  const createdAt = new Date().toISOString();
  state.repository.conversations.push({
    id: conversationId,
    organizationId: input.organizationId,
    type: "student",
    subject: `Bài nộp mới · ${input.assignmentTitle}`,
    relatedClassId: input.classId,
    relatedStudentId: input.studentId,
    status: "open",
    createdByUserId: input.studentId,
    createdAt,
  });
  state.repository.conversationMembers.push(
    {
      id: `${conversationId}-student`,
      organizationId: input.organizationId,
      conversationId,
      userId: input.studentId,
      role: "student",
      status: "active",
      joinedAt: createdAt,
      createdByUserId: input.studentId,
    },
    {
      id: `${conversationId}-teacher`,
      organizationId: input.organizationId,
      conversationId,
      userId: "teacher-demo",
      role: "teacher",
      status: "active",
      joinedAt: createdAt,
      createdByUserId: input.studentId,
    },
  );
  state.repository.messages.push({
    id: `${conversationId}-message`,
    organizationId: input.organizationId,
    conversationId,
    senderUserId: input.studentId,
    body: `Học viên đã nộp bài "${input.assignmentTitle}". Bài đang chờ giáo viên chấm.`,
    status: "sent",
    sentAt: createdAt,
  });
  await persistCommunication();
}

@Controller("communications")
export class TeacherCommunicationController {
  @Get("teacher")
  async list(@Headers() headers: HeaderMap, @Query("mode") mode: CommunicationMode = "teaching") {
    await ensureCommunicationLoaded();
    const current = actor(headers);
    const allowedType = mode === "internal" ? new Set(["internal", "support"]) : new Set(["parent_teacher", "student"]);
    return state.repository.conversations
      .filter(
        (conversation) => conversation.organizationId === current.organizationId && allowedType.has(conversation.type),
      )
      .filter((conversation) =>
        state.repository.conversationMembers.some(
          (member) =>
            member.conversationId === conversation.id && member.userId === current.userId && member.status === "active",
        ),
      )
        .map((conversation) => this.view(current.organizationId, conversation.id, current.userId));
  }

  @Get("student")
  async listStudent(@Headers() headers: HeaderMap) {
    await ensureCommunicationLoaded();
    return this.listForMember(actor(headers), new Set(["student", "class"]));
  }

  @Get("parent")
  async listParent(@Headers() headers: HeaderMap) {
    await ensureCommunicationLoaded();
    return this.listForMember(actor(headers), new Set(["parent_teacher"]));
  }

  @Post("student/conversations")
  async createStudent(@Headers() headers: HeaderMap, @Body() body: { subject?: string; firstMessage?: string; relatedClassId?: string }) {
    await ensureCommunicationLoaded();
    return this.createForMember(actor(headers), "student", body, "teacher-demo");
  }

  @Post("parent/conversations")
  async createParent(@Headers() headers: HeaderMap, @Body() body: { subject?: string; firstMessage?: string; relatedClassId?: string }) {
    await ensureCommunicationLoaded();
    return this.createForMember(actor(headers), "parent_teacher", body, "teacher-demo");
  }

  @Post("student/conversations/:id/messages")
  async sendStudent(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { body?: string }) {
    await ensureCommunicationLoaded();
    return this.sendForMember(actor(headers), id, body);
  }

  @Post("parent/conversations/:id/messages")
  async sendParent(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { body?: string }) {
    await ensureCommunicationLoaded();
    return this.sendForMember(actor(headers), id, body);
  }

  @Post("teacher/conversations")
  async create(
    @Headers() headers: HeaderMap,
    @Body()
    body: {
      mode?: CommunicationMode;
      recipient?: string;
      subject?: string;
      firstMessage?: string;
      relatedClassId?: string;
      relatedStudentId?: string;
    },
  ) {
    await ensureCommunicationLoaded();
    const current = actor(headers);
    if (!body?.recipient || !body.subject || !body.firstMessage)
      throw new BadRequestException("recipient_subject_firstMessage_required");
    const mode = body.mode === "internal" ? "internal" : "teaching";
    const conversation = state.service.createConversation(current, {
      type: mode === "internal" ? "internal" : body.recipient.includes("Học viên") ? "student" : "parent_teacher",
      subject: body.subject,
      relatedClassId: body.relatedClassId,
      relatedStudentId: body.relatedStudentId,
      memberUserIds: [body.recipient],
    });
      state.service.sendMessage(current, conversation.id, { body: body.firstMessage });
      await persistCommunication();
      return this.view(current.organizationId, conversation.id, current.userId);
  }

  @Post("teacher/conversations/:id/messages")
  async send(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { body?: string }) {
    await ensureCommunicationLoaded();
    const current = actor(headers);
    if (!body?.body?.trim()) throw new BadRequestException("body_required");
    try {
      state.service.sendMessage(current, id, { body: body.body });
      await persistCommunication();
      return this.view(current.organizationId, id, current.userId);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "message_failed");
    }
  }

  private listForMember(current: ReturnType<typeof actor>, allowedTypes: Set<string>) {
    return state.repository.conversations
      .filter((conversation) => conversation.organizationId === current.organizationId && allowedTypes.has(conversation.type))
      .filter((conversation) => state.repository.conversationMembers.some((member) => member.conversationId === conversation.id && member.userId === current.userId && member.status === "active"))
      .map((conversation) => this.view(current.organizationId, conversation.id, current.userId));
  }

  private async createForMember(current: ReturnType<typeof actor>, type: "student" | "parent_teacher", body: { subject?: string; firstMessage?: string; relatedClassId?: string }, recipient: string) {
    if (!body?.subject?.trim() || !body?.firstMessage?.trim()) throw new BadRequestException("subject_firstMessage_required");
    const conversation = state.service.createConversation(current, { type, subject: body.subject, relatedClassId: body.relatedClassId, memberUserIds: [recipient] });
    state.service.sendMessage(current, conversation.id, { body: body.firstMessage });
    await persistCommunication();
    return this.view(current.organizationId, conversation.id, current.userId);
  }

  private async sendForMember(current: ReturnType<typeof actor>, id: string, body: { body?: string }) {
    if (!body?.body?.trim()) throw new BadRequestException("body_required");
    try {
      state.service.sendMessage(current, id, { body: body.body });
      await persistCommunication();
      return this.view(current.organizationId, id, current.userId);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "message_failed");
    }
  }

  private view(organizationId: string, conversationId: string, viewerUserId = "teacher-demo") {
    const conversation = state.repository.conversations.find(
      (item) => item.organizationId === organizationId && item.id === conversationId,
    );
    if (!conversation) throw new BadRequestException("conversation_not_found");
    const members = state.repository.conversationMembers.filter((member) => member.conversationId === conversation.id && member.userId !== viewerUserId);
    const recipient = members[0];
    const title =
      recipient?.userId === "teacher-demo"
        ? "Giáo viên phụ trách"
        : recipient?.userId === "academic-demo"
        ? "Học vụ"
        : recipient?.userId === "support-demo"
          ? "CSKH"
          : (recipient?.userId ?? "Người nhận");
    const messages = state.repository.messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    return {
      id: conversation.id,
      title,
      role: recipient?.userId === "teacher-demo" ? "teacher" : recipient?.role ?? "staff",
      channel:
        conversation.type === "parent_teacher"
          ? "parent"
          : conversation.type === "student"
            ? "student"
            : conversation.type === "support"
              ? "support"
              : "academic",
      context: conversation.relatedClassId ? `Phạm vi lớp · ${conversation.relatedClassId}` : "Trao đổi nội bộ",
      subject: conversation.subject,
      lastMessage: messages.at(-1)?.body ?? "",
      updatedAt: messages.at(-1)?.sentAt ?? conversation.createdAt,
      unread: conversation.id.startsWith("learning-submission-") ? 1 : 0,
      status: conversation.status === "open" ? "Đang mở" : "Đã đóng",
      messages: messages.map((message) => ({
        id: message.id,
        sender: message.senderUserId === viewerUserId ? "teacher" : "other",
        author: message.senderUserId === viewerUserId ? "Bạn" : title,
        body: message.body,
        sentAt: message.sentAt,
      })),
    };
  }
}
