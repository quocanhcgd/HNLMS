import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(__dirname, "../../docs/security/privacy-retention.md");
describe("privacy retention policy", () => {
  it("covers every required data-governance control and role impact", () => {
    const content = fs.readFileSync(file, "utf8");
    for (const term of ["Legal basis", "Default retention", "Access and propagation", "Export/delete/anonymize", "Audit and redaction", "Identity and account", "Learning and assessment", "Communication", "Media and recordings", "Finance and payroll", "AI processing", "parent/guardian", "legal hold", "teacher", "student", "parent", "finance/HR", "reporting"]) expect(content).toContain(term);
  });
});
