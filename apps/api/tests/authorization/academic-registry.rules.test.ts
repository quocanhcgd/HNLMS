import { describe, expect, it } from "vitest";
import { findScheduleConflict, scheduleOverlaps, teacherWorkloadWithinLimit } from "../../src/modules/academic-learning/drizzle-academic-registry-repository.js";

describe("academic registry business rules", () => {
  it("detects overlapping schedules only when the resource is shared", () => {
    expect(scheduleOverlaps({ weekday: 2, startsAt: "18:00", endsAt: "19:30" }, { weekday: 2, startsAt: "19:00", endsAt: "20:00" })).toBe(true);
    expect(scheduleOverlaps({ weekday: 2, startsAt: "18:00", endsAt: "19:00" }, { weekday: 3, startsAt: "18:00", endsAt: "19:00" })).toBe(false);
    expect(findScheduleConflict({ weekday: 2, startsAt: "18:00", endsAt: "19:30", roomId: "A" }, [{ id: "s1", weekday: 2, startsAt: "19:00", endsAt: "20:00", roomId: "A", teacherUserId: null, onlineSessionKey: null, status: "confirmed" }])).toBeTruthy();
    expect(findScheduleConflict({ weekday: 2, startsAt: "18:00", endsAt: "19:30", roomId: "B" }, [{ id: "s1", weekday: 2, startsAt: "19:00", endsAt: "20:00", roomId: "A", teacherUserId: null, onlineSessionKey: null, status: "confirmed" }])).toBeUndefined();
  });

  it("enforces valid weekday and time ranges", () => {
    expect(() => findScheduleConflict({ weekday: 8, startsAt: "18:00", endsAt: "19:00" }, [])).toThrow("invalid_schedule_weekday");
    expect(() => findScheduleConflict({ weekday: 2, startsAt: "19:00", endsAt: "18:00" }, [])).toThrow("invalid_schedule_range");
  });

  it("keeps teacher weekly hours within the configured limit", () => {
    expect(teacherWorkloadWithinLimit(24, 16)).toBe(true);
    expect(teacherWorkloadWithinLimit(24, 17)).toBe(false);
    expect(teacherWorkloadWithinLimit(24, 0)).toBe(true);
  });
});
