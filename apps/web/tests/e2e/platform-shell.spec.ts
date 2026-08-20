import { expect, test } from "@playwright/test";

test("platform shell owns control-plane navigation", async ({ page }) => {
  await page.goto("/platform");
  await expect(page.locator('[data-platform-shell="true"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Platform navigation" })).toBeVisible();
  await expect(page.getByText("Tenant operations", { exact: true })).toBeVisible();
  await expect(page.locator(".sidebar")).toHaveCount(0);
});

test("platform shell remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/platform");
  await expect(page.locator('[data-platform-shell="true"]')).toBeVisible();
  await expect(page.locator(".platformMobileTitle")).toBeVisible();
  await expect(page.locator(".platformSidebar")).toBeHidden();
});
