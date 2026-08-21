import { expect, test } from "@playwright/test";

test("theme preset preview, publish and rollback keep the route", async ({ page }) => {
  await page.goto("/ui-preview");
  await expect(page.getByText("Theme preset", { exact: true })).toBeVisible();
  const preset = page.getByRole("textbox", { name: "Preset" });
  await preset.click();
  await page.getByRole("option", { name: "hnlms-high-contrast v1" }).click();
  await expect(page.getByText("Đang preview", { exact: true })).toBeVisible();
  await expect(page.getByText(/Light contrast/)).toBeVisible();
  await page.getByRole("button", { name: "Publish preview" }).click();
  await expect(page.getByText(/Đã publish hnlms-high-contrast/)).toBeVisible();
  await page.getByRole("button", { name: "Rollback" }).click();
  await expect(page.getByText(/Đã publish hnlms-operational/)).toBeVisible();
  await expect(page).toHaveURL(/\/ui-preview$/);
});
