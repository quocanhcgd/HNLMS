import { expect, test } from "@playwright/test";
test("teacher and student follow the session delivery flow", async ({ page }) => {
  await page.goto("/teacher/worklog");
  await expect(page.getByText("Chuẩn bị đủ học liệu trước giờ dạy", { exact: false })).toBeVisible();
  await page.getByLabel("Loại học liệu").click();
  await expect(page.getByRole("option", { name: "Bài tập trên lớp" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Bài tập về nhà" })).toBeVisible();
  await page.goto("/student/homework");
  await expect(page.getByText("không cần tải file về máy", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mở bài giảng trong hệ thống" })).toBeVisible();
});
