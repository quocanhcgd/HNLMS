import { expect, test } from "@playwright/test";

test.describe("US6 parent portal", () => {
  test("parent views delegated learning data and conversations", async ({ page }) => {
    await page.goto("/admin/parent");
    await expect(page.locator(".pageHeader").getByText("Cổng phụ huynh", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Nguyễn An", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Còn 2.000.000đ", { exact: true })).toBeVisible();

    await page.goto("/admin/parent/conversations");
    await expect(page.locator(".pageHeader").getByText("Trao đổi với giáo viên", { exact: true })).toBeVisible();
    await expect(page.getByText("Trao đổi tiến độ tuần", { exact: true })).toBeVisible();
  });
});
