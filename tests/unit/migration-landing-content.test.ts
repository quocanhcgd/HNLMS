import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function landingContentMigrationSql(): string {
  for (const file of readdirSync(resolve("infra/migrations")).filter((name) => name.endsWith(".sql"))) {
    const sql = readFileSync(resolve("infra/migrations", file), "utf-8");
    if (sql.includes('CREATE TABLE "landing_contents"')) return sql;
  }
  throw new Error("landing_content_migration_not_found");
}

describe("marketing-admission migration", () => {
  it("adds landing_content enums, table and publishing-focused indexes", () => {
    const sql = landingContentMigrationSql();

    expect(sql).toContain('"landing_content_status"');
    expect(sql).toContain('"landing_content_kind"');
    expect(sql).toContain('CREATE TABLE "landing_contents"');
    expect(sql).toContain('"landing_contents_organization_slug_version_unique"');
    expect(sql).toContain('"landing_contents_public_listing_index"');
  });
});
