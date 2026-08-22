import { expect, test } from "@playwright/test";

test.describe("US10 online class workspaces", () => {
  test("teacher sees online class session list", async ({ page }) => {
    await page.goto("/teacher/online");
    await expect(page.locator(".pageHeader").getByText("Lớp học online", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("IF-2609", { exact: true })).toBeVisible();
    await expect(page.getByText("Buổi học kế tiếp", { exact: true })).toBeVisible();
  });

  test("student sees online session list and upcoming join hint", async ({ page }) => {
    await page.goto("/student/online");
    await expect(page.locator(".pageHeader").getByText("Lớp online", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Bạn nên vào trước 5 phút.", { exact: true })).toBeVisible();
  });

  test("parent sees child online session list with safety note", async ({ page }) => {
    await page.goto("/parent/online");
    await expect(page.locator(".pageHeader").getByText("Lớp online của con", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Hệ thống chỉ hiển thị bản ghi khi phụ huynh được phép.", { exact: true })).toBeVisible();
  });
});
