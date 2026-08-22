import { expect, test } from "@playwright/test";

test.describe("US4 academic administration", () => {
  test("reviews published programs and creates a program draft", async ({ page }) => {
    await page.goto("/admin/academic");
    await expect(page.getByText("Quản lý đào tạo", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Lộ trình IELTS", { exact: true })).toBeVisible();
    await expect(page.getByText("Đã công bố", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tạo chương trình" }).last().click();
    await expect(page.getByText("Đã tạo bản nháp chương trình mới.")).toBeVisible();
  });

  test("opens the class and schedule workspace with capacity and conflict guard", async ({ page }) => {
    await page.goto("/admin/academic");
    await page.getByRole("button", { name: "Lớp học và lịch" }).click();
    await expect(page.getByText("Lớp học đang quản lý", { exact: true })).toBeVisible();
    await expect(page.getByText("IF-2609", { exact: true })).toBeVisible();
    await expect(page.getByText("Kiểm tra xung đột lịch", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mở lớp mới" }).click();
    await expect(page.getByText("Đã tạo lớp ở trạng thái mở tuyển sinh.")).toBeVisible();
  });
});
