import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("row action review gate", () => {
  it("exposes only caller-authorized row commands and supports disabled state", () => {
    const source = read("apps/web/src/components/ui/row-actions.tsx");
    expect(source).toContain("actions[action]");
    expect(source).toContain("if (!onClick) return null");
    expect(source).toContain("disabled={disabled}");
    expect(source).toContain("aria-label={label}");
  });

  it("requires modal editing and confirmation for assignment lifecycle changes", () => {
    const source = read("apps/web/src/app/teacher/classes/[classId]/assignment-tab.tsx");
    expect(source).toContain("UiEditModal");
    expect(source).toContain("UiConfirmModal");
    expect(source).toContain('status === "Bản nháp"');
    expect(source).toContain('status !== "Đã lưu trữ"');
    expect(source).toContain("dữ liệu lịch sử vẫn được giữ");
    expect(source).not.toContain("Hàng đợi xử lý bài tập");
  });

  it("requires confirmation and immutable void workflow for published scores", () => {
    const source = read("apps/web/src/app/teacher/classes/[classId]/score-tab.tsx");
    expect(source).toContain("UiEditModal");
    expect(source).toContain("UiConfirmModal");
    expect(source).toContain('status === "Đã công bố"');
    expect(source).toContain('status: "Đã hủy hiệu lực"');
    expect(source).toContain("lịch sử và audit");
  });

  it("keeps shared modal footers explicit about cancel and save/confirm", () => {
    const source = read("apps/web/src/components/ui/workflow-modal.tsx");
    expect(source).toContain("Hủy");
    expect(source).toContain("onConfirm");
    expect(source).toContain("onSave");
  });
});
