import { expect, test } from "@playwright/test";

test.describe("US8 assessment workspaces", () => {
  test("student opens assessment engine and sees published recommendation", async ({ page }) => {
    await page.goto("/student/assessment");
    await expect(page.locator(".pageHeader").getByText("Bài kiểm tra", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Kiểm tra đầu vào IELTS Foundation", { exact: true })).toBeVisible();
    await expect(page.getByText("Tự động lưu câu trả lời; hệ thống sẽ tự nộp khi hết giờ.", { exact: true })).toBeVisible();
    await expect(page.getByText("Đề xuất: IELTS Foundation A2+", { exact: true })).toBeVisible();
  });

  test("teacher opens assessment review workspace and sees grading controls", async ({ page }) => {
    await page.goto("/teacher/assessment");
    await expect(page.locator(".pageHeader").getByText("Chấm bài & đề thi", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();
    await expect(page.getByText("Phiếu chấm nhanh", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Công bố kết quả" })).toBeVisible();
  });
});
