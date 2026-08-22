import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";
import { academicClasses, students } from "../academic-learning/schema";

export const parentLinkStatus = pgEnum("parent_link_status", ["active", "revoked", "expired"]);
export const parentDelegationStatus = pgEnum("parent_delegation_status", ["active", "revoked", "expired"]);

export const conversationType = pgEnum("conversation_type", [
  "internal",
  "class",
  "student",
  "parent_teacher",
  "support",
]);
export const conversationStatus = pgEnum("conversation_status", ["open", "muted", "closed", "archived"]);
export const conversationMemberRole = pgEnum("conversation_member_role", [
  "owner",
  "moderator",
  "teacher",
  "staff",
  "parent",
  "student",
  "observer",
]);
export const conversationMemberStatus = pgEnum("conversation_member_status", ["active", "muted", "left", "removed"]);
export const messageStatus = pgEnum("message_status", ["sent", "edited", "deleted", "hidden"]);
export const notificationStatus = pgEnum("notification_status", ["draft", "scheduled", "published", "cancelled"]);
export const notificationDeliveryChannel = pgEnum("notification_delivery_channel", ["in_app", "email"]);
export const notificationDeliveryStatus = pgEnum("notification_delivery_status", [
  "pending",
  "sent",
  "read",
  "failed",
  "cancelled",
]);

export const parentLinks = pgTable(
  "parent_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    parentUserId: uuid("parent_user_id")
      .notNull()
      .references(() => users.id),
    relationship: text("relationship").notNull(),
    status: parentLinkStatus("status").notNull().default("active"),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    studentParentUnique: uniqueIndex("parent_links_student_parent_unique").on(table.studentId, table.parentUserId),
    organizationParentIndex: index("parent_links_organization_parent_index").on(
      table.organizationId,
      table.parentUserId,
      table.status,
    ),
  }),
);

export const parentDelegations = pgTable(
  "parent_delegations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    parentLinkId: uuid("parent_link_id")
      .notNull()
      .references(() => parentLinks.id),
    permissions: jsonb("permissions").notNull(),
    status: parentDelegationStatus("status").notNull().default("active"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    linkStatusIndex: index("parent_delegations_link_status_index").on(table.parentLinkId, table.status),
    organizationStatusIndex: index("parent_delegations_organization_status_index").on(
      table.organizationId,
      table.status,
    ),
  }),
);

export type ParentLinkRow = typeof parentLinks.$inferSelect;
export type NewParentLinkRow = typeof parentLinks.$inferInsert;
export type ParentDelegationRow = typeof parentDelegations.$inferSelect;
export type NewParentDelegationRow = typeof parentDelegations.$inferInsert;

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    type: conversationType("type").notNull().default("internal"),
    subject: text("subject").notNull(),
    relatedClassId: uuid("related_class_id").references(() => academicClasses.id),
    relatedStudentId: uuid("related_student_id").references(() => students.id),
    parentLinkId: uuid("parent_link_id").references(() => parentLinks.id),
    status: conversationStatus("status").notNull().default("open"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationStatusIndex: index("conversations_organization_status_index").on(table.organizationId, table.status),
    organizationClassIndex: index("conversations_organization_class_index").on(
      table.organizationId,
      table.relatedClassId,
    ),
    organizationStudentIndex: index("conversations_organization_student_index").on(
      table.organizationId,
      table.relatedStudentId,
    ),
  }),
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: conversationMemberRole("role").notNull().default("observer"),
    status: conversationMemberStatus("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    conversationUserUnique: uniqueIndex("conversation_members_conversation_user_unique").on(
      table.conversationId,
      table.userId,
    ),
    organizationUserIndex: index("conversation_members_organization_user_index").on(
      table.organizationId,
      table.userId,
      table.status,
    ),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    attachments: jsonb("attachments"),
    status: messageStatus("status").notNull().default("sent"),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    conversationSentIndex: index("messages_conversation_sent_index").on(table.conversationId, table.sentAt),
    organizationSenderIndex: index("messages_organization_sender_index").on(table.organizationId, table.senderUserId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    audience: jsonb("audience").notNull(),
    metadata: jsonb("metadata"),
    status: notificationStatus("status").notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationStatusIndex: index("notifications_organization_status_index").on(table.organizationId, table.status),
    organizationScheduleIndex: index("notifications_organization_schedule_index").on(
      table.organizationId,
      table.scheduledAt,
    ),
  }),
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    channel: notificationDeliveryChannel("channel").notNull().default("in_app"),
    status: notificationDeliveryStatus("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    notificationUserChannelUnique: uniqueIndex("notification_deliveries_notification_user_channel_unique").on(
      table.notificationId,
      table.userId,
      table.channel,
    ),
    organizationUserStatusIndex: index("notification_deliveries_organization_user_status_index").on(
      table.organizationId,
      table.userId,
      table.status,
    ),
  }),
);

export type ConversationRow = typeof conversations.$inferSelect;
export type NewConversationRow = typeof conversations.$inferInsert;
export type ConversationMemberRow = typeof conversationMembers.$inferSelect;
export type NewConversationMemberRow = typeof conversationMembers.$inferInsert;
export type MessageRow = typeof messages.$inferSelect;
export type NewMessageRow = typeof messages.$inferInsert;
export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
export type NotificationDeliveryRow = typeof notificationDeliveries.$inferSelect;
export type NewNotificationDeliveryRow = typeof notificationDeliveries.$inferInsert;
