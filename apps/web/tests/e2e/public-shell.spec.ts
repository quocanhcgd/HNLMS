import { expect, test } from "@playwright/test";

test("public shell owns navigation and footer", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-public-shell="true"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Public navigation" })).toBeVisible();
  await expect(page.getByText("© 2026 HN Learning. Bản quyền thuộc về HN Learning.")).toBeVisible();
  await expect(page.locator(".sidebar")).toHaveCount(0);
});

test("public mobile menu opens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("link", { name: "Vào portal học tập" })).toBeVisible();
});
