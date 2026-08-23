import { expect, test } from "@playwright/test";
test("session material actions do not hang", async ({ page }) => {
  await page.goto("/teacher/classes/if-2609/sessions");
  await page.getByRole("button", { name: "Xem / thêm" }).first().click();
  await expect(page.getByText("Học liệu của buổi này", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem lại" }).first()).toBeVisible();
});
