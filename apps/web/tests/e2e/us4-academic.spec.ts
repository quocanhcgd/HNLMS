import { expect, test } from "@playwright/test";

test.describe("US4 academic administration", () => {
  test("reviews published programs with the shared table layout", async ({ page }) => {
    await page.goto("/admin/academic");
    await expect(page.getByText("Chương trình đào tạo", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/academic\/programs$/);
    await expect(page.getByRole("link", { name: "Đào tạo" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Đào tạo" })).toHaveCount(1);
    await expect(page.getByText("Lộ trình IELTS", { exact: true })).toBeVisible();
    await expect(page.getByText("Đã công bố", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tạo chương trình" })).toBeVisible();
  });

  test("opens the class workspace with capacity and status table", async ({ page }) => {
    await page.goto("/admin/academic/classes");
    await expect(page.locator(".pageHeader").getByText("Lớp học", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/academic\/classes$/);
    await expect(page.getByRole("link", { name: "Lớp học" }).first()).toBeVisible();
    await expect(page.getByText("IF-2609", { exact: true })).toBeVisible();
    await expect(page.getByText("11/12", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mở lớp mới" })).toBeVisible();
  });
});
