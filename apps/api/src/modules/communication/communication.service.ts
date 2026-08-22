export type ParentLinkStatus = "active" | "revoked" | "expired";
export type ParentDelegationStatus = "active" | "revoked" | "expired";
export type ParentPermission =
  "view_schedule" | "view_progress" | "view_scores" | "view_attendance" | "view_finance" | "message_teacher";

export type CommunicationActor = { userId: string; organizationId: string };
export type ParentLink = {
  id: string;
  organizationId: string;
  studentId: string;
  parentUserId: string;
  relationship: string;
  status: ParentLinkStatus;
  linkedAt: string;
  revokedAt?: string;
  createdByUserId: string;
};
export type ParentDelegation = {
  id: string;
  organizationId: string;
  parentLinkId: string;
  permissions: ParentPermission[];
  status: ParentDelegationStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  revokedAt?: string;
  createdByUserId: string;
};
export type ParentScopedAccess = {
  parentUserId: string;
  organizationId: string;
  studentIds: Set<string>;
  permissionsByStudentId: Map<string, Set<ParentPermission>>;
};
export type ConversationType = "internal" | "class" | "student" | "parent_teacher" | "support";
export type ConversationStatus = "open" | "muted" | "closed" | "archived";
export type ConversationMemberRole = "owner" | "moderator" | "teacher" | "staff" | "parent" | "student" | "observer";
export type ConversationMemberStatus = "active" | "muted" | "left" | "removed";
export type MessageStatus = "sent" | "edited" | "deleted" | "hidden";
export type NotificationStatus = "draft" | "scheduled" | "published" | "cancelled";
export type NotificationDeliveryChannel = "in_app" | "email";
export type NotificationDeliveryStatus = "pending" | "sent" | "read" | "failed" | "cancelled";
export type Conversation = {
  id: string;
  organizationId: string;
  type: ConversationType;
  subject: string;
  relatedClassId?: string;
  relatedStudentId?: string;
  parentLinkId?: string;
  status: ConversationStatus;
  createdByUserId: string;
  createdAt: string;
};
export type ConversationMember = {
  id: string;
  organizationId: string;
  conversationId: string;
  userId: string;
  role: ConversationMemberRole;
  status: ConversationMemberStatus;
  joinedAt: string;
  leftAt?: string;
  createdByUserId: string;
};
export type Message = {
  id: string;
  organizationId: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  attachments?: { id: string; filename: string; mimeType: string; sizeBytes: number }[];
  status: MessageStatus;
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
};
export type NotificationAudience = {
  userIds?: string[];
  conversationId?: string;
  classId?: string;
  parentLinkIds?: string[];
};
export type Notification = {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  metadata?: unknown;
  status: NotificationStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdByUserId: string;
};
export type NotificationDelivery = {
  id: string;
  organizationId: string;
  notificationId: string;
  userId: string;
  channel: NotificationDeliveryChannel;
  status: NotificationDeliveryStatus;
  retryCount: number;
  errorMessage?: string;
  sentAt?: string;
  readAt?: string;
};
export type CommunicationRepository = {
  parentLinks: ParentLink[];
  parentDelegations: ParentDelegation[];
  conversations: Conversation[];
  conversationMembers: ConversationMember[];
  messages: Message[];
  notifications: Notification[];
  notificationDeliveries: NotificationDelivery[];
};

export class CommunicationServiceError extends Error {
  constructor(
    public readonly code: "not_found" | "forbidden" | "invalid_input" | "invalid_status" | string,
    message = code,
  ) {
    super(message);
    this.name = "CommunicationServiceError";
  }
}

const text = (value: string, field: string) => {
  const normalized = value.trim();
  if (!normalized) throw new CommunicationServiceError("invalid_input", `${field}_required`);
  return normalized;
};
const asTime = (value?: string) => (value ? new Date(value).getTime() : undefined);

export class CommunicationService {
  constructor(
    private readonly repository: CommunicationRepository,
    private readonly newId: (kind: string) => string = (kind) => `${kind}-${crypto.randomUUID()}`,
  ) {}

  linkParent(
    actor: CommunicationActor,
    input: { studentId: string; parentUserId: string; relationship: string; linkedAt?: string },
  ): ParentLink {
    const existing = this.repository.parentLinks.find(
      (x) =>
        x.organizationId === actor.organizationId &&
        x.studentId === input.studentId &&
        x.parentUserId === input.parentUserId &&
        x.status === "active",
    );
    if (existing) throw new CommunicationServiceError("invalid_input", "parent_link_duplicated");
    const item: ParentLink = {
      id: this.newId("parent-link"),
      organizationId: actor.organizationId,
      studentId: input.studentId,
      parentUserId: input.parentUserId,
      relationship: text(input.relationship, "relationship"),
      status: "active",
      linkedAt: input.linkedAt ?? new Date().toISOString(),
      createdByUserId: actor.userId,
    };
    this.repository.parentLinks.push(item);
    return item;
  }

  revokeParentLink(actor: CommunicationActor, parentLinkId: string): ParentLink {
    const link = this.parentLink(actor, parentLinkId);
    if (link.status !== "active") throw new CommunicationServiceError("invalid_status", "parent_link_not_active");
    link.status = "revoked";
    link.revokedAt = new Date().toISOString();
    for (const delegation of this.repository.parentDelegations.filter(
      (x) => x.parentLinkId === link.id && x.status === "active",
    )) {
      delegation.status = "revoked";
      delegation.revokedAt = link.revokedAt;
    }
    return link;
  }

  grantDelegation(
    actor: CommunicationActor,
    input: { parentLinkId: string; permissions: ParentPermission[]; effectiveFrom?: string; effectiveTo?: string },
  ): ParentDelegation {
    const link = this.parentLink(actor, input.parentLinkId);
    if (link.status !== "active") throw new CommunicationServiceError("invalid_status", "parent_link_not_active");
    const permissions = [...new Set(input.permissions)];
    if (!permissions.length) throw new CommunicationServiceError("invalid_input", "permissions_required");
    const effectiveFrom = input.effectiveFrom ?? new Date().toISOString();
    if (input.effectiveTo && asTime(input.effectiveTo)! <= asTime(effectiveFrom)!)
      throw new CommunicationServiceError("invalid_input", "delegation_time_invalid");
    const item: ParentDelegation = {
      id: this.newId("parent-delegation"),
      organizationId: actor.organizationId,
      parentLinkId: link.id,
      permissions,
      status: "active",
      effectiveFrom,
      effectiveTo: input.effectiveTo,
      createdByUserId: actor.userId,
    };
    this.repository.parentDelegations.push(item);
    return item;
  }

  revokeDelegation(actor: CommunicationActor, delegationId: string): ParentDelegation {
    const delegation = this.delegation(actor, delegationId);
    if (delegation.status !== "active") throw new CommunicationServiceError("invalid_status", "delegation_not_active");
    delegation.status = "revoked";
    delegation.revokedAt = new Date().toISOString();
    return delegation;
  }

  expireDelegations(now = new Date()): ParentDelegation[] {
    const timestamp = now.getTime();
    const expired: ParentDelegation[] = [];
    for (const delegation of this.repository.parentDelegations) {
      if (delegation.status === "active" && delegation.effectiveTo && asTime(delegation.effectiveTo)! <= timestamp) {
        delegation.status = "expired";
        expired.push(delegation);
      }
    }
    for (const link of this.repository.parentLinks) {
      if (
        link.status === "active" &&
        !this.repository.parentDelegations.some((x) => x.parentLinkId === link.id && x.status === "active")
      ) {
        const hadDelegation = this.repository.parentDelegations.some((x) => x.parentLinkId === link.id);
        if (hadDelegation) link.status = "expired";
      }
    }
    return expired;
  }

  resolveParentScope(actor: CommunicationActor, parentUserId = actor.userId, now = new Date()): ParentScopedAccess {
    this.expireDelegations(now);
    const scope: ParentScopedAccess = {
      parentUserId,
      organizationId: actor.organizationId,
      studentIds: new Set(),
      permissionsByStudentId: new Map(),
    };
    const activeLinks = this.repository.parentLinks.filter(
      (x) => x.organizationId === actor.organizationId && x.parentUserId === parentUserId && x.status === "active",
    );
    for (const link of activeLinks) {
      const activeDelegations = this.repository.parentDelegations.filter(
        (x) =>
          x.organizationId === actor.organizationId &&
          x.parentLinkId === link.id &&
          x.status === "active" &&
          asTime(x.effectiveFrom)! <= now.getTime() &&
          (!x.effectiveTo || asTime(x.effectiveTo)! > now.getTime()),
      );
      for (const delegation of activeDelegations) {
        scope.studentIds.add(link.studentId);
        const permissions = scope.permissionsByStudentId.get(link.studentId) ?? new Set<ParentPermission>();
        for (const permission of delegation.permissions) permissions.add(permission);
        scope.permissionsByStudentId.set(link.studentId, permissions);
      }
    }
    return scope;
  }

  assertParentPermission(actor: CommunicationActor, studentId: string, permission: ParentPermission) {
    const scope = this.resolveParentScope(actor);
    if (!scope.permissionsByStudentId.get(studentId)?.has(permission))
      throw new CommunicationServiceError("forbidden", "parent_permission_required");
  }

  createThreePartyConversation(
    actor: CommunicationActor,
    input: { parentLinkId: string; teacherUserId: string; subject: string; initialMessage?: string },
  ): Conversation {
    const link = this.parentLink(actor, input.parentLinkId);
    if (link.status !== "active") throw new CommunicationServiceError("invalid_status", "parent_link_not_active");
    const conversation: Conversation = {
      id: this.newId("conversation"),
      organizationId: actor.organizationId,
      type: "parent_teacher",
      subject: text(input.subject, "subject"),
      relatedStudentId: link.studentId,
      parentLinkId: link.id,
      status: "open",
      createdByUserId: actor.userId,
      createdAt: new Date().toISOString(),
    };
    this.repository.conversations.push(conversation);
    this.addConversationMember(actor, conversation.id, { userId: actor.userId, role: "moderator" });
    this.addConversationMember(actor, conversation.id, { userId: input.teacherUserId, role: "teacher" });
    this.addConversationMember(actor, conversation.id, { userId: link.parentUserId, role: "parent" });
    if (input.initialMessage) this.sendMessage(actor, conversation.id, { body: input.initialMessage });
    return conversation;
  }

  createConversation(
    actor: CommunicationActor,
    input: {
      type?: ConversationType;
      subject: string;
      relatedClassId?: string;
      relatedStudentId?: string;
      memberUserIds?: string[];
    },
  ): Conversation {
    const conversation: Conversation = {
      id: this.newId("conversation"),
      organizationId: actor.organizationId,
      type: input.type ?? "internal",
      subject: text(input.subject, "subject"),
      relatedClassId: input.relatedClassId,
      relatedStudentId: input.relatedStudentId,
      status: "open",
      createdByUserId: actor.userId,
      createdAt: new Date().toISOString(),
    };
    this.repository.conversations.push(conversation);
    this.addConversationMember(actor, conversation.id, { userId: actor.userId, role: "owner" });
    for (const userId of input.memberUserIds ?? [])
      this.addConversationMember(actor, conversation.id, { userId, role: "observer" });
    return conversation;
  }

  addConversationMember(
    actor: CommunicationActor,
    conversationId: string,
    input: { userId: string; role: ConversationMemberRole },
  ): ConversationMember {
    const conversation = this.conversation(actor, conversationId);
    const existing = this.repository.conversationMembers.find(
      (x) => x.conversationId === conversation.id && x.userId === input.userId,
    );
    if (existing && existing.status === "active")
      throw new CommunicationServiceError("invalid_input", "conversation_member_duplicated");
    if (existing) {
      existing.role = input.role;
      existing.status = "active";
      existing.leftAt = undefined;
      return existing;
    }
    const member: ConversationMember = {
      id: this.newId("conversation-member"),
      organizationId: actor.organizationId,
      conversationId: conversation.id,
      userId: input.userId,
      role: input.role,
      status: "active",
      joinedAt: new Date().toISOString(),
      createdByUserId: actor.userId,
    };
    this.repository.conversationMembers.push(member);
    return member;
  }

  changeConversationMemberStatus(
    actor: CommunicationActor,
    conversationId: string,
    userId: string,
    status: ConversationMemberStatus,
  ): ConversationMember {
    const member = this.conversationMember(actor, conversationId, userId);
    member.status = status;
    if (status === "left" || status === "removed") member.leftAt = new Date().toISOString();
    return member;
  }

  sendMessage(
    actor: CommunicationActor,
    conversationId: string,
    input: { body: string; attachments?: Message["attachments"] },
  ): Message {
    const conversation = this.conversation(actor, conversationId);
    if (conversation.status === "closed" || conversation.status === "archived")
      throw new CommunicationServiceError("invalid_status", "conversation_not_open");
    const member = this.conversationMember(actor, conversationId, actor.userId);
    if (member.status !== "active") throw new CommunicationServiceError("forbidden", "conversation_member_not_active");
    for (const attachment of input.attachments ?? []) {
      if (attachment.sizeBytes > 25 * 1024 * 1024)
        throw new CommunicationServiceError("invalid_input", "attachment_too_large");
    }
    const message: Message = {
      id: this.newId("message"),
      organizationId: actor.organizationId,
      conversationId: conversation.id,
      senderUserId: actor.userId,
      body: text(input.body, "body"),
      attachments: input.attachments,
      status: "sent",
      sentAt: new Date().toISOString(),
    };
    this.repository.messages.push(message);
    return message;
  }

  moderateMessage(
    actor: CommunicationActor,
    messageId: string,
    status: Extract<MessageStatus, "hidden" | "deleted">,
  ): Message {
    const message = this.message(actor, messageId);
    const member = this.conversationMember(actor, message.conversationId, actor.userId);
    if (member.role !== "owner" && member.role !== "moderator")
      throw new CommunicationServiceError("forbidden", "moderator_required");
    message.status = status;
    if (status === "deleted") message.deletedAt = new Date().toISOString();
    return message;
  }

  setConversationStatus(actor: CommunicationActor, conversationId: string, status: ConversationStatus): Conversation {
    const conversation = this.conversation(actor, conversationId);
    const member = this.conversationMember(actor, conversationId, actor.userId);
    if (member.role !== "owner" && member.role !== "moderator")
      throw new CommunicationServiceError("forbidden", "moderator_required");
    conversation.status = status;
    return conversation;
  }

  createNotification(
    actor: CommunicationActor,
    input: { title: string; body: string; audience: NotificationAudience; metadata?: unknown; scheduledAt?: string },
  ): Notification {
    const notification: Notification = {
      id: this.newId("notification"),
      organizationId: actor.organizationId,
      title: text(input.title, "title"),
      body: text(input.body, "body"),
      audience: input.audience,
      metadata: input.metadata,
      scheduledAt: input.scheduledAt,
      status: input.scheduledAt ? "scheduled" : "draft",
      createdByUserId: actor.userId,
    };
    this.repository.notifications.push(notification);
    return notification;
  }

  resolveNotificationAudience(actor: CommunicationActor, audience: NotificationAudience): string[] {
    const userIds = new Set(audience.userIds ?? []);
    if (audience.conversationId) {
      const conversation = this.conversation(actor, audience.conversationId);
      this.repository.conversationMembers
        .filter((x) => x.conversationId === conversation.id && x.status === "active")
        .forEach((x) => userIds.add(x.userId));
    }
    if (audience.parentLinkIds?.length) {
      this.repository.parentLinks
        .filter(
          (x) =>
            x.organizationId === actor.organizationId &&
            audience.parentLinkIds!.includes(x.id) &&
            x.status === "active",
        )
        .forEach((x) => userIds.add(x.parentUserId));
    }
    if (audience.classId) {
      this.repository.conversations
        .filter((x) => x.organizationId === actor.organizationId && x.relatedClassId === audience.classId)
        .forEach((conversation) => {
          this.repository.conversationMembers
            .filter((x) => x.conversationId === conversation.id && x.status === "active")
            .forEach((x) => userIds.add(x.userId));
        });
    }
    return [...userIds].sort();
  }

  publishNotification(
    actor: CommunicationActor,
    notificationId: string,
    channels: NotificationDeliveryChannel[] = ["in_app"],
  ): NotificationDelivery[] {
    const notification = this.notification(actor, notificationId);
    if (notification.status === "cancelled")
      throw new CommunicationServiceError("invalid_status", "notification_cancelled");
    notification.status = "published";
    notification.publishedAt = new Date().toISOString();
    const userIds = this.resolveNotificationAudience(actor, notification.audience);
    const deliveries: NotificationDelivery[] = [];
    for (const userId of userIds) {
      for (const channel of channels) {
        const existing = this.repository.notificationDeliveries.find(
          (x) => x.notificationId === notification.id && x.userId === userId && x.channel === channel,
        );
        if (existing) continue;
        const delivery: NotificationDelivery = {
          id: this.newId("notification-delivery"),
          organizationId: actor.organizationId,
          notificationId: notification.id,
          userId,
          channel,
          status: "pending",
          retryCount: 0,
        };
        this.repository.notificationDeliveries.push(delivery);
        deliveries.push(delivery);
      }
    }
    return deliveries;
  }

  private parentLink(actor: CommunicationActor, id: string) {
    const item = this.repository.parentLinks.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new CommunicationServiceError("not_found", "parent_link_not_found");
    return item;
  }
  private delegation(actor: CommunicationActor, id: string) {
    const item = this.repository.parentDelegations.find(
      (x) => x.id === id && x.organizationId === actor.organizationId,
    );
    if (!item) throw new CommunicationServiceError("not_found", "delegation_not_found");
    return item;
  }
  private conversation(actor: CommunicationActor, id: string) {
    const item = this.repository.conversations.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new CommunicationServiceError("not_found", "conversation_not_found");
    return item;
  }
  private conversationMember(actor: CommunicationActor, conversationId: string, userId: string) {
    const item = this.repository.conversationMembers.find(
      (x) => x.organizationId === actor.organizationId && x.conversationId === conversationId && x.userId === userId,
    );
    if (!item) throw new CommunicationServiceError("forbidden", "conversation_member_required");
    return item;
  }
  private message(actor: CommunicationActor, id: string) {
    const item = this.repository.messages.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new CommunicationServiceError("not_found", "message_not_found");
    return item;
  }
  private notification(actor: CommunicationActor, id: string) {
    const item = this.repository.notifications.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new CommunicationServiceError("not_found", "notification_not_found");
    return item;
  }
}
