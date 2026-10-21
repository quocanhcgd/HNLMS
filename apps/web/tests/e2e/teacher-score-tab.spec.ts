import { expect, test } from "@playwright/test";
test("teacher grades and publishes score", async ({ page }) => {
  await page.goto("/teacher/classes/if-2609/scores");
  await page.getByRole("button", { name: "Chấm và công bố" }).first().click();
  await expect(page.getByText(/Chấm bài ·/)).toBeVisible();
  await page.getByLabel(/Điểm \(tối đa/).fill("8");
  await page.getByRole("button", { name: "Công bố kết quả" }).last().click();
  await expect(page.getByText("Đã công bố điểm và nhận xét", { exact: false })).toBeVisible();
});
