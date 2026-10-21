import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const migrations = path.resolve(process.cwd(), "infra/migrations");
describe("migration smoke contract", () => {
  it("keeps a Drizzle journal and matching SQL artifacts", () => {
    const journal = JSON.parse(fs.readFileSync(path.join(migrations, "meta", "_journal.json"), "utf8")) as { entries: { tag: string }[] };
    expect(journal.entries.length).toBeGreaterThan(0);
    for (const entry of journal.entries) expect(fs.existsSync(path.join(migrations, `${entry.tag}.sql`))).toBe(true);
  });
});
