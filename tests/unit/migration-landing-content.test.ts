import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function latestMigrationSql(): string {
  const journal = JSON.parse(readFileSync(resolve("infra/migrations/meta/_journal.json"), "utf-8")) as {
    entries: Array<{ tag: string }>;
  };
  const latest = journal.entries[journal.entries.length - 1];
  if (!latest) {
    throw new Error("migration_journal_empty");
  }

  return readFileSync(resolve(`infra/migrations/${latest.tag}.sql`), "utf-8");
}

describe("marketing-admission migration", () => {
  it("adds landing_content enums, table and publishing-focused indexes in the latest migration", () => {
    const sql = latestMigrationSql();

    expect(sql).toContain('"landing_content_status"');
    expect(sql).toContain('"landing_content_kind"');
    expect(sql).toContain('CREATE TABLE "landing_contents"');
    expect(sql).toContain('"landing_contents_organization_slug_version_unique"');
    expect(sql).toContain('"landing_contents_public_listing_index"');
  });
});
