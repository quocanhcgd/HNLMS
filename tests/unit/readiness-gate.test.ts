import { describe, expect, it } from "vitest";
import { evaluateChecklist } from "../../scripts/readiness-gate.mjs";

describe("full-stack readiness gate", () => {
  it("passes implementation only when critical implementation items are checked", () => {
    const markdown = [
      "## Critical Before Implementation",
      "- [x] package policy",
      "- [ ] missing evidence",
      "## Critical Before Production Data",
      "- [ ] production rehearsal",
    ].join("\n");
    expect(evaluateChecklist(markdown)).toMatchObject({ production: false, passed: false, blockers: [{ label: "missing evidence" }] });
    expect(evaluateChecklist(markdown, { production: true }).blockers).toHaveLength(2);
  });

  it("accepts a fully evidenced production checklist", () => {
    const markdown = [
      "## Critical Before Implementation",
      "- [x] implementation",
      "## Critical Before Production Data",
      "- [x] data",
      "## Product Release Gates",
      "- [x] release",
    ].join("\n");
    expect(evaluateChecklist(markdown, { production: true }).passed).toBe(true);
  });
});
