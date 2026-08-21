import { expect, test } from "@playwright/test";

test("US1 admin foundations are reachable and keep LMS shell", async ({ page }) => {
  for (const route of ["/admin/access", "/admin/settings", "/admin/modules"]) {
    await page.goto(route);
    await expect(page.locator('[data-product-space="lms"]')).toBeVisible();
    await expect(page.locator(".sidebar")).toBeVisible();
  }
});

test("module management explains effective state", async ({ page }) => {
  await page.goto("/admin/modules");
  await expect(page.getByText(/Identity & access/)).toBeVisible();
  await expect(page.getByText(/Enabled by organization configuration/).first()).toBeVisible();
});
