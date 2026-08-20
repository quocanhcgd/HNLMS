import { expect, test } from "@playwright/test";

test("route metadata and deep links survive refresh/history", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HN Learning/);
  await page.goto("/platform");
  await expect(page).toHaveTitle(/Control Plane/);
  await page.goto("/admin/leads");
  await expect(page).toHaveTitle(/LMS Application/);
  await expect(page.locator('[data-product-space="lms"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-product-space="lms"]')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveTitle(/Control Plane/);
  await page.goBack();
  await expect(page).toHaveTitle(/HN Learning/);
});

test("unknown route uses the not-found boundary", async ({ page }) => {
  await page.goto("/route-that-does-not-exist");
  await expect(page.getByText("Trang bạn tìm không tồn tại hoặc đã được chuyển.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Về trang chủ" })).toBeVisible();
});
