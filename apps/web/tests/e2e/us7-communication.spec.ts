import { expect, test } from "@playwright/test";

test.describe("US7 communication center", () => {
  test("admin views conversations and notification inbox", async ({ page }) => {
    await page.goto("/admin/communication");
    await expect(page.locator(".pageHeader").getByText("Trung tâm trao đổi", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Trao đổi tiến độ Nguyễn An", { exact: true })).toBeVisible();

    await page.goto("/admin/communication/notifications");
    await expect(page.locator(".pageHeader").getByText("Hộp thông báo", { exact: true })).toBeVisible();
    await expect(page.getByText("Nhắc lịch học hôm nay", { exact: true })).toBeVisible();
  });
});
