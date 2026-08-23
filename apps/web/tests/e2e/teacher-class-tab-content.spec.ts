import { expect, test } from "@playwright/test";
const tabChecks = [
  ["students", "Danh sách học viên"],
  ["sessions", "Buổi tuần này"],
  ["assignments", "Chờ chấm trên lớp"],
  ["materials", "Học liệu buổi kế tiếp"],
  ["attendance", "Tỷ lệ tham dự"],
  ["scores", "Điểm trung bình"],
  ["feedback", "Phản hồi buổi học gần nhất"],
] as const;
test("class tabs show their own business content", async ({ page }) => {
  for (const [tab, text] of tabChecks) {
    await page.goto(`/teacher/classes/if-2609/${tab}`);
    await expect(page.locator(".classDetailContent").getByText(text, { exact: false }).first()).toBeVisible();
  }
});
