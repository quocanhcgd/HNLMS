import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  consultations,
  leadAssignments,
  leadAssignmentStatus,
  leads,
  leadStatus,
} from "../../apps/api/src/modules/marketing-admission/schema";

function latestMigrationSql(): string {
  const journal = JSON.parse(readFileSync(resolve("infra/migrations/meta/_journal.json"), "utf-8")) as {
    entries: Array<{ tag: string }>;
  };
  const latest = journal.entries.at(-1);
  if (!latest) throw new Error("migration_journal_empty");
  return readFileSync(resolve(`infra/migrations/${latest.tag}.sql`), "utf-8");
}

describe("T053 admission entities", () => {
  it("exports Lead, Consultation and LeadAssignment tables with tenant ownership", () => {
    expect(getTableName(leads)).toBe("leads");
    expect(getTableName(consultations)).toBe("consultations");
    expect(getTableName(leadAssignments)).toBe("lead_assignments");
    expect(leads.organizationId.notNull).toBe(true);
    expect(consultations.organizationId.notNull).toBe(true);
    expect(leadAssignments.organizationId.notNull).toBe(true);
  });

  it("defines the lead and assignment lifecycle states", () => {
    expect(leadStatus.enumValues).toEqual([
      "new",
      "contacted",
      "consulting",
      "awaiting_assessment",
      "class_proposed",
      "enrolled",
      "disqualified",
      "archived",
    ]);
    expect(leadAssignmentStatus.enumValues).toEqual(["active", "transferred", "completed", "cancelled"]);
  });

  it("generates consent, routing and follow-up constraints in the latest migration", () => {
    const sql = latestMigrationSql();

    expect(sql).toContain('CREATE TABLE "leads"');
    expect(sql).toContain('CREATE TABLE "lead_assignments"');
    expect(sql).toContain('CREATE TABLE "consultations"');
    expect(sql).toContain('"consented_at" timestamp with time zone NOT NULL');
    expect(sql).toContain('"client_submission_key" text');
    expect(sql).toContain('"leads_organization_submission_key_unique"');
    expect(sql).toContain('"lead_assignments_active_lead_unique"');
    expect(sql).toContain('WHERE "lead_assignments"."status" = \'active\'');
    expect(sql).toContain('CONSTRAINT "lead_assignments_target_required" CHECK');
    expect(sql).toContain('"next_action_at" timestamp with time zone');
  });
});
