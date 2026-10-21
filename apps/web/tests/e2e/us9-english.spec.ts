import { expect, test } from "@playwright/test";

test.describe("US9 competency profile", () => {
  test("student sees published profile and teacher opens scoped review", async ({ page }) => {
    await page.goto("/student/english");
    await expect(page.locator(".pageHeader").getByText("Hồ sơ năng lực", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Tiếng Anh|Toán|Ngữ văn/, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/minh chứng đã công bố/i).first()).toBeVisible();

    await page.goto("/teacher/english");
    await expect(page).toHaveURL(/\/teacher\/competency$/);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".pageHeader").getByText("Hồ sơ năng lực", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Từ ngày đánh giá")).toBeVisible();
    await expect(page.getByLabel("Đến ngày đánh giá")).toBeVisible();
    await page.getByRole("button", { name: "Rà soát" }).first().click();
    await expect(page.getByText("Rà soát năng lực", { exact: true })).toBeVisible();
  });
});
