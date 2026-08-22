import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";
import { academicClasses, academicSchedules, students } from "../academic-learning/schema";

export const onlineProviderKind = pgEnum("online_provider_kind", ["zoom", "google_meet", "teams", "custom"]);
export const onlineSessionStatus = pgEnum("online_session_status", ["draft", "scheduled", "live", "completed", "cancelled", "failed"]);
export const onlineAttendanceSyncStatus = pgEnum("online_attendance_sync_status", ["pending", "synced", "partial", "failed", "ignored"]);
export const onlineRecordingStatus = pgEnum("online_recording_status", ["pending", "processing", "ready", "restricted", "deleted", "failed"]);

export const onlineProviderMappings = pgTable(
  "online_provider_mappings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    provider: onlineProviderKind("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    displayName: text("display_name").notNull(),
    webhookSecretRef: text("webhook_secret_ref"),
    settings: jsonb("settings"),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationProviderAccountUnique: uniqueIndex("online_provider_mappings_org_provider_account_unique").on(
      table.organizationId,
      table.provider,
      table.providerAccountId,
    ),
    organizationProviderIndex: index("online_provider_mappings_org_provider_index").on(table.organizationId, table.provider),
  }),
);

export const onlineSessions = pgTable(
  "online_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    classId: uuid("class_id").notNull().references(() => academicClasses.id),
    scheduleId: uuid("schedule_id").references(() => academicSchedules.id),
    providerMappingId: uuid("provider_mapping_id").notNull().references(() => onlineProviderMappings.id),
    title: text("title").notNull(),
    description: text("description"),
    providerMeetingId: text("provider_meeting_id"),
    joinUrl: text("join_url"),
    hostUrlSecretRef: text("host_url_secret_ref"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: onlineSessionStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationClassTimeIndex: index("online_sessions_org_class_time_index").on(table.organizationId, table.classId, table.startsAt),
    providerMeetingUnique: uniqueIndex("online_sessions_provider_meeting_unique").on(
      table.organizationId,
      table.providerMappingId,
      table.providerMeetingId,
    ),
  }),
);

export const onlineAttendanceSyncs = pgTable(
  "online_attendance_syncs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    sessionId: uuid("session_id").notNull().references(() => onlineSessions.id),
    studentId: uuid("student_id").references(() => students.id),
    providerParticipantId: text("provider_participant_id"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    syncStatus: onlineAttendanceSyncStatus("sync_status").notNull().default("pending"),
    rawEvent: jsonb("raw_event"),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionStudentUnique: uniqueIndex("online_attendance_syncs_session_student_unique").on(table.sessionId, table.studentId),
    organizationSessionIndex: index("online_attendance_syncs_org_session_index").on(table.organizationId, table.sessionId, table.syncStatus),
  }),
);

export const onlineRecordings = pgTable(
  "online_recordings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    sessionId: uuid("session_id").notNull().references(() => onlineSessions.id),
    providerRecordingId: text("provider_recording_id"),
    title: text("title").notNull(),
    durationSeconds: integer("duration_seconds"),
    storageKey: text("storage_key"),
    playbackUrlSecretRef: text("playback_url_secret_ref"),
    accessPolicy: jsonb("access_policy"),
    status: onlineRecordingStatus("status").notNull().default("pending"),
    availableAt: timestamp("available_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerRecordingUnique: uniqueIndex("online_recordings_provider_recording_unique").on(
      table.organizationId,
      table.sessionId,
      table.providerRecordingId,
    ),
    organizationSessionIndex: index("online_recordings_org_session_index").on(table.organizationId, table.sessionId, table.status),
  }),
);

export type OnlineProviderMapping = typeof onlineProviderMappings.$inferSelect;
export type NewOnlineProviderMapping = typeof onlineProviderMappings.$inferInsert;
export type OnlineSession = typeof onlineSessions.$inferSelect;
export type NewOnlineSession = typeof onlineSessions.$inferInsert;
export type OnlineAttendanceSync = typeof onlineAttendanceSyncs.$inferSelect;
export type NewOnlineAttendanceSync = typeof onlineAttendanceSyncs.$inferInsert;
export type OnlineRecording = typeof onlineRecordings.$inferSelect;
export type NewOnlineRecording = typeof onlineRecordings.$inferInsert;
