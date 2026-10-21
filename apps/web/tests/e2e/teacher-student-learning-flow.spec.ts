import { expect, test } from "@playwright/test";
test("teacher and student follow the session delivery flow", async ({ page }) => {
  await page.goto("/teacher/worklog");
  await expect(page.getByText("Chuẩn bị đủ học liệu", { exact: false })).toBeVisible();
  const targetRow = page.getByRole("row").filter({ hasText: "Listening clinic · Unit 5" });
  await expect(targetRow).toBeVisible();
  await targetRow.getByRole("button", { name: "Quản lý học liệu", exact: true }).click();
  await page.getByRole("textbox", { name: "Loại học liệu" }).click();
  await expect(page.getByRole("option", { name: "Bài tập trên lớp" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Bài tập về nhà" })).toBeVisible();
  await page.getByRole("textbox", { name: "Loại học liệu" }).press("Escape");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await targetRow.getByRole("button", { name: "Quản lý học liệu", exact: true }).click();
  await page.getByRole("button", { name: "Lưu học liệu", exact: true }).click();

  await targetRow.getByRole("button", { name: "Chi tiết", exact: true }).click();
  await expect(page.getByText("Hoàn tất theo thứ tự học liệu, điểm danh và xác nhận worklog.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();

  await targetRow.getByRole("button", { name: "Ghi điểm danh", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ghi nhận điểm danh", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ghi nhận điểm danh", exact: true }).click();

  const readyRow = page.getByRole("row").filter({ hasText: "Listening clinic · Unit 5" });
  await expect(readyRow).toBeVisible();
  await readyRow.getByRole("button", { name: "Xác nhận công", exact: true }).click();
  await page.getByLabel("Ghi chú gửi học vụ/payroll").fill("Đã hoàn thành nội dung và điểm danh theo kế hoạch.");
  await page.getByRole("button", { name: "Gửi xác nhận", exact: true }).click();
  await expect(page.getByText("Đã gửi worklog", { exact: false })).toBeVisible();

  await page.goto("/student/homework");
  await page.getByRole("button", { name: "Học liệu", exact: true }).first().click();
  await expect(page).toHaveURL(/\/student\/classes\/if-2609/);
  await page.getByRole("button", { name: "Xem buổi học" }).first().click();
  await expect(page.getByText("Bài giảng và tài nguyên đính kèm", { exact: true })).toBeVisible();
});
