import { expect, test } from "@playwright/test";

test.describe("US4 academic administration", () => {
  test("reviews published programs and creates a program draft", async ({ page }) => {
    await page.goto("/admin/academic");
    await expect(page.getByText("Chương trình và học phần", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/academic\/programs$/);
    await expect(page.getByRole("link", { name: "Đào tạo" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Đào tạo" })).toHaveCount(1);
    await expect(page.getByText("Lộ trình IELTS", { exact: true })).toBeVisible();
    await expect(page.getByText("Đã công bố", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tạo chương trình" }).click();
    await expect(page.getByText("Đã tạo bản nháp chương trình mới.")).toBeVisible();
  });

  test("opens the class and schedule workspace with capacity and conflict guard", async ({ page }) => {
    await page.goto("/admin/academic/classes");
    await expect(page.getByText("Danh sách lớp học", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/academic\/classes$/);
    await expect(page.getByRole("link", { name: "Lớp học" }).first()).toBeVisible();
    await expect(page.getByText("IF-2609", { exact: true })).toBeVisible();
    await expect(page.getByText("Kiểm tra xung đột lịch", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mở lớp mới" }).click();
    await expect(page.getByText("Đã tạo lớp ở trạng thái mở tuyển sinh.")).toBeVisible();
  });
});
