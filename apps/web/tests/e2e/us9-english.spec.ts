import { expect, test } from "@playwright/test";

test.describe("US9 English pathway", () => {
  test("student sees four-skill progress and teacher opens review form", async ({ page }) => {
    await page.goto("/student/english");
    await expect(page.locator(".pageHeader").getByText("Lộ trình tiếng Anh", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Overall level: A2", { exact: false })).toBeVisible();

    await page.goto("/teacher/english");
    await expect(page.locator(".pageHeader").getByText("Rà soát tiếng Anh", { exact: true })).toBeVisible();
    await expect(page.getByText("Nhận xét thủ công", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ghi nhận review" })).toBeVisible();
  });
});
