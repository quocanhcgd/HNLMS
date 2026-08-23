import { expect, test } from "@playwright/test";
test("teacher opens an assigned class and navigates its business tabs", async ({ page }) => {
  await page.goto("/teacher/classes");
  await page.getByRole("link", { name: /IF-2609/ }).first().click();
  await expect(page.getByText("IF-2609 · IELTS Foundation A2+", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lịch học" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Bài tập" })).toBeVisible();
  await page.getByRole("link", { name: "Bài tập" }).click();
  await expect(page.locator(".classDetailContent").getByText("Bài tập trên lớp chấm ngay", { exact: false }).first()).toBeVisible();
});
