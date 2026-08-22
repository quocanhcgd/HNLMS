import { describe, expect, it } from "vitest";
import { InMemoryMeetingSyncRepository, MeetingSyncError, MeetingSyncWorker } from "../../worker/src/jobs/meeting-sync/index.js";

const baseSession = {
  id: "session-1",
  organizationId: "org-1",
  providerMappingId: "pm-1",
  providerMeetingId: "meeting-1",
  status: "scheduled" as const,
  startedAt: null,
  completedAt: null,
};

describe("meeting sync worker", () => {
  it("reconciles meeting lifecycle events into session status", async () => {
    const repository = new InMemoryMeetingSyncRepository();
    repository.sessions.push(structuredClone(baseSession));
    const worker = new MeetingSyncWorker(repository);
    const startedAt = new Date("2026-08-22T11:00:00.000Z");
    const result = await worker.process({
      id: "inbox-1",
      organizationId: "org-1",
      providerMappingId: "pm-1",
      eventId: "evt-start",
      eventType: "meeting.started",
      providerMeetingId: "meeting-1",
      receivedAt: startedAt,
      payload: {},
    });

    expect(result).toMatchObject({ reconciled: true, sessionId: "session-1", updatedStatus: "live" });
    expect(repository.sessions[0]?.status).toBe("live");
    expect(repository.sessions[0]?.startedAt).toEqual(startedAt);
  });

  it("syncs attendance and flags unmatched provider participants", async () => {
    const repository = new InMemoryMeetingSyncRepository();
    repository.sessions.push(structuredClone(baseSession));
    const worker = new MeetingSyncWorker(repository);
    const result = await worker.process({
      id: "inbox-2",
      organizationId: "org-1",
      providerMappingId: "pm-1",
      eventId: "evt-attendance",
      eventType: "attendance.updated",
      providerMeetingId: "meeting-1",
      receivedAt: new Date("2026-08-22T11:30:00.000Z"),
      payload: {
        participants: [
          { studentId: "student-1", providerParticipantId: "p-1", durationSeconds: 1800 },
          { providerParticipantId: "guest-1", durationSeconds: 300 },
        ],
      },
    });

    expect(result.attendanceCount).toBe(2);
    expect(result.warnings).toContain("unmatched:guest-1");
    expect(repository.attendance.map((item) => item.syncStatus)).toEqual(["synced", "partial"]);
  });

  it("creates recording permission links for ready recordings", async () => {
    const repository = new InMemoryMeetingSyncRepository();
    repository.sessions.push(structuredClone(baseSession));
    const worker = new MeetingSyncWorker(repository);
    const result = await worker.process({
      id: "inbox-3",
      organizationId: "org-1",
      providerMappingId: "pm-1",
      eventId: "evt-recording",
      eventType: "recording.ready",
      providerMeetingId: "meeting-1",
      receivedAt: new Date("2026-08-22T12:00:00.000Z"),
      payload: { recordings: [{ providerRecordingId: "rec-1", title: "Buổi học Unit 4", durationSeconds: 3600 }] },
    });

    expect(result.recordingCount).toBe(1);
    expect(repository.recordings[0]).toMatchObject({
      status: "ready",
      permissionLink: "/recordings/org-1/session-1/rec-1/permission",
    });
  });

  it("rejects events that cannot be reconciled to a session", async () => {
    const worker = new MeetingSyncWorker(new InMemoryMeetingSyncRepository());
    await expect(
      worker.process({
        id: "inbox-4",
        organizationId: "org-1",
        providerMappingId: "pm-1",
        eventId: "evt-missing",
        eventType: "meeting.ended",
        providerMeetingId: "meeting-404",
        receivedAt: new Date(),
        payload: {},
      }),
    ).rejects.toThrow(new MeetingSyncError("session_not_found"));
  });
});
