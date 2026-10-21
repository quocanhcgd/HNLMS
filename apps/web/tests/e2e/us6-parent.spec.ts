import { expect, test } from "@playwright/test";

test.describe("US6 parent portal", () => {
  test("parent views delegated learning data and conversations", async ({ page }) => {
    await page.goto("/parent");
    await expect(page.locator(".pageHeader").getByText("Cổng phụ huynh", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Nguyễn Minh Anh", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Còn 2.000.000đ", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Xem bài tập" })).toHaveAttribute("href", "/parent/classes/if-2609");
    await expect(page.getByRole("link", { name: "Xem học phí" })).toHaveAttribute(
      "href",
      "/parent/payments?student=student-minh-anh",
    );
    await expect(page.getByRole("link", { name: "Xem thông báo" })).toHaveAttribute(
      "href",
      "/parent/notifications?student=student-minh-anh",
    );

    await page.goto("/parent/conversations");
    await expect(page.locator(".pageHeader").getByText("Trao đổi với giáo viên", { exact: true })).toBeVisible();
    await expect(page.getByText("Trao đổi tiến độ tuần", { exact: true })).toBeVisible();
  });
});
