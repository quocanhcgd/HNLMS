import { expect, test } from "@playwright/test";

test("LMS navigation shows grouped active submenu", async ({ page }) => {
  await page.goto("/admin/leads");
  await expect(page.getByRole("navigation", { name: "LMS navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Khách hàng tiềm năng" })).toHaveClass(/active/);
  await expect(page.getByRole("link", { name: "Tuyển sinh" })).toHaveClass(/active/);
});

test("LMS mobile navigation opens in a drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Đóng/mở sidebar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "LMS navigation" })).toBeVisible();
});
