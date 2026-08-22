import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("shared page/data states", () => {
  it("exports the standard page states and compositions", () => {
    const index = readFileSync("apps/web/src/components/domain/index.ts", "utf8");
    for (const name of [
      "LoadingState",
      "EmptyState",
      "ErrorState",
      "ForbiddenState",
      "PageFrame",
      "ConfirmationSummary",
    ])
      expect(index).toContain(name);
  });
  it("uses the shared data table empty state in the lead list", () => {
    expect(readFileSync("apps/web/src/app/admin/leads/page.tsx", "utf8")).toContain("UiDataTable");
    expect(readFileSync("apps/web/src/app/admin/leads/page.tsx", "utf8")).toContain("emptyTitle");
  });
});
