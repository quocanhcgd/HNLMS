import { expect, test } from "@playwright/test";

test("product spaces keep separate route boundaries", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-product-space="public"]')).toBeVisible();
  await expect(page.locator(".sidebar")).toHaveCount(0);

  await page.goto("/platform");
  await expect(page.locator('[data-product-space="platform"]')).toBeVisible();
  await expect(page.locator(".sidebar")).toHaveCount(0);

  await page.goto("/admin");
  await expect(page.locator('[data-product-space="lms"]')).toBeVisible();
  await expect(page.locator(".sidebar")).toBeVisible();
});
