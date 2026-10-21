import { expect, test } from "@playwright/test";
const tabChecks = [
  ["students", "Danh sách học viên"],
  ["sessions", "Toàn bộ lịch buổi học của khóa"],
  ["assignments", "Tạo bài"],
  ["materials", "tài liệu lớp"],
  ["attendance", "Điểm danh"],
  ["scores", "bài chờ chấm"],
  ["feedback", "Ghi nhận phản hồi buổi học"],
] as const;
test("class tabs show their own business content", async ({ page }) => {
  for (const [tab, text] of tabChecks) {
    await page.goto(`/teacher/classes/if-2609/${tab}`);
    await expect(page.locator(".classDetailContent").getByText(text, { exact: false }).first()).toBeVisible();
  }
});
