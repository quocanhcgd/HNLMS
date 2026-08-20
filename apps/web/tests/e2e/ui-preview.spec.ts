import { expect, test } from "@playwright/test";

test("UI preview loads", async ({ page }) => {
  await page.goto("/ui-preview");
  await expect(page).toHaveTitle(/HN LMS UI Preview/);
  await expect(page.getByText("Thư viện component", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preset", "hnlms-operational@1");
});

test("locale preference persists after refresh", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Change language" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Branch overview", { exact: true })).toBeVisible();
});
