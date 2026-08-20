import { expect, test } from "@playwright/test";

test("UI preview loads", async ({ page }) => {
  await page.goto("/ui-preview");
  await expect(page).toHaveTitle(/HN LMS UI Preview/);
  await expect(page.getByText("Thư viện component", { exact: true })).toBeVisible();
});
