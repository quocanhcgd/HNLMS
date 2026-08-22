export type MeetingSyncEventType = "meeting.started" | "meeting.ended" | "attendance.updated" | "recording.ready";

export type MeetingSyncInboxEvent = {
  id: string;
  organizationId: string;
  providerMappingId: string;
  eventId: string;
  eventType: MeetingSyncEventType;
  providerMeetingId: string;
  receivedAt: Date;
  payload: Record<string, unknown>;
};

export type MeetingSyncSession = {
  id: string;
  organizationId: string;
  providerMappingId: string;
  providerMeetingId: string;
  status: "scheduled" | "live" | "completed" | "cancelled" | "failed";
  startedAt: Date | null;
  completedAt: Date | null;
};

export type AttendanceParticipantPayload = {
  studentId?: string;
  providerParticipantId: string;
  joinedAt?: string;
  leftAt?: string;
  durationSeconds?: number;
};

export type MeetingAttendanceSync = {
  organizationId: string;
  sessionId: string;
  studentId: string | null;
  providerParticipantId: string;
  joinedAt: Date | null;
  leftAt: Date | null;
  durationSeconds: number | null;
  syncStatus: "synced" | "partial" | "failed";
};

export type MeetingRecordingLink = {
  organizationId: string;
  sessionId: string;
  providerRecordingId: string;
  title: string;
  durationSeconds: number | null;
  status: "ready" | "restricted";
  permissionLink: string;
};

export type MeetingSyncResult = {
  eventId: string;
  reconciled: boolean;
  sessionId: string | null;
  updatedStatus?: MeetingSyncSession["status"];
  attendanceCount: number;
  recordingCount: number;
  warnings: string[];
};

export type MeetingSyncRepository = {
  findSessionByProviderMeeting(input: {
    organizationId: string;
    providerMappingId: string;
    providerMeetingId: string;
  }): Promise<MeetingSyncSession | null>;
  updateSession(session: MeetingSyncSession): Promise<MeetingSyncSession>;
  upsertAttendance(input: MeetingAttendanceSync[]): Promise<MeetingAttendanceSync[]>;
  upsertRecording(input: MeetingRecordingLink[]): Promise<MeetingRecordingLink[]>;
};

export class MeetingSyncError extends Error {
  constructor(public readonly code: "session_not_found" | "invalid_event") {
    super(code);
    this.name = "MeetingSyncError";
  }
}

export class MeetingSyncWorker {
  constructor(private readonly repository: MeetingSyncRepository) {}

  async process(event: MeetingSyncInboxEvent): Promise<MeetingSyncResult> {
    if (!event.providerMeetingId) throw new MeetingSyncError("invalid_event");
    const session = await this.repository.findSessionByProviderMeeting({
      organizationId: event.organizationId,
      providerMappingId: event.providerMappingId,
      providerMeetingId: event.providerMeetingId,
    });
    if (!session) throw new MeetingSyncError("session_not_found");

    const warnings: string[] = [];
    let updatedStatus: MeetingSyncSession["status"] | undefined;
    let attendanceCount = 0;
    let recordingCount = 0;

    if (event.eventType === "meeting.started") {
      updatedStatus = "live";
      await this.repository.updateSession({ ...session, status: "live", startedAt: event.receivedAt });
    }
    if (event.eventType === "meeting.ended") {
      updatedStatus = "completed";
      await this.repository.updateSession({ ...session, status: "completed", completedAt: event.receivedAt });
    }
    if (event.eventType === "attendance.updated") {
      const participants = parseParticipants(event.payload);
      const attendance = participants.map((participant) => ({
        organizationId: event.organizationId,
        sessionId: session.id,
        studentId: participant.studentId ?? null,
        providerParticipantId: participant.providerParticipantId,
        joinedAt: participant.joinedAt ? new Date(participant.joinedAt) : null,
        leftAt: participant.leftAt ? new Date(participant.leftAt) : null,
        durationSeconds: participant.durationSeconds ?? null,
        syncStatus: participant.studentId ? "synced" as const : "partial" as const,
      }));
      warnings.push(...attendance.filter((item) => item.syncStatus === "partial").map((item) => `unmatched:${item.providerParticipantId}`));
      attendanceCount = (await this.repository.upsertAttendance(attendance)).length;
    }
    if (event.eventType === "recording.ready") {
      const recordings = parseRecordings(event.payload).map((recording) => ({
        organizationId: event.organizationId,
        sessionId: session.id,
        providerRecordingId: recording.providerRecordingId,
        title: recording.title,
        durationSeconds: recording.durationSeconds ?? null,
        status: recording.restricted ? "restricted" as const : "ready" as const,
        permissionLink: createRecordingPermissionLink(event.organizationId, session.id, recording.providerRecordingId),
      }));
      recordingCount = (await this.repository.upsertRecording(recordings)).length;
    }

    return { eventId: event.eventId, reconciled: true, sessionId: session.id, updatedStatus, attendanceCount, recordingCount, warnings };
  }
}

export class InMemoryMeetingSyncRepository implements MeetingSyncRepository {
  readonly sessions: MeetingSyncSession[] = [];
  readonly attendance: MeetingAttendanceSync[] = [];
  readonly recordings: MeetingRecordingLink[] = [];

  async findSessionByProviderMeeting(input: { organizationId: string; providerMappingId: string; providerMeetingId: string }) {
    const session = this.sessions.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.providerMappingId === input.providerMappingId && candidate.providerMeetingId === input.providerMeetingId,
    );
    return session ? structuredClone(session) : null;
  }

  async updateSession(session: MeetingSyncSession) {
    const index = this.sessions.findIndex((candidate) => candidate.id === session.id && candidate.organizationId === session.organizationId);
    if (index < 0) throw new MeetingSyncError("session_not_found");
    this.sessions[index] = structuredClone(session);
    return structuredClone(session);
  }

  async upsertAttendance(input: MeetingAttendanceSync[]) {
    for (const item of input) {
      const index = this.attendance.findIndex(
        (candidate) => candidate.sessionId === item.sessionId && candidate.providerParticipantId === item.providerParticipantId,
      );
      if (index >= 0) this.attendance[index] = structuredClone(item);
      else this.attendance.push(structuredClone(item));
    }
    return structuredClone(input);
  }

  async upsertRecording(input: MeetingRecordingLink[]) {
    for (const item of input) {
      const index = this.recordings.findIndex(
        (candidate) => candidate.sessionId === item.sessionId && candidate.providerRecordingId === item.providerRecordingId,
      );
      if (index >= 0) this.recordings[index] = structuredClone(item);
      else this.recordings.push(structuredClone(item));
    }
    return structuredClone(input);
  }
}

function parseParticipants(payload: Record<string, unknown>): AttendanceParticipantPayload[] {
  const value = payload.participants;
  return Array.isArray(value) ? value.map((item) => item as AttendanceParticipantPayload).filter((item) => Boolean(item.providerParticipantId)) : [];
}

function parseRecordings(payload: Record<string, unknown>) {
  const value = payload.recordings;
  return Array.isArray(value)
    ? value.map((item) => item as { providerRecordingId: string; title?: string; durationSeconds?: number; restricted?: boolean }).filter((item) => Boolean(item.providerRecordingId)).map((item) => ({ ...item, title: item.title ?? "Bản ghi lớp học" }))
    : [];
}

export function createRecordingPermissionLink(organizationId: string, sessionId: string, providerRecordingId: string) {
  return `/recordings/${organizationId}/${sessionId}/${providerRecordingId}/permission`;
}
